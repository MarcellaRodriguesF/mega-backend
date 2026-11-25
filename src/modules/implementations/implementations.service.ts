import { Prisma } from "../../generated/prisma/client.js";

import { prisma } from "../../database/prisma.js";
import { ApiError } from "../../shared/http/api-error.js";
import { assertSameIdSet } from "../templates/templates.rules.js";
import {
  captureFromUnit,
  ImplementationsRepository,
} from "./implementations.repository.js";
import {
  assertImplementationTemplatePublished,
  assertTemplateHasExecutableStructure,
  resolveOrganization,
} from "./implementations.rules.js";
import type {
  CatalogUnitsQuery,
  CreateImplementationInput,
  ListImplementationsQuery,
  ReorderStagesInput,
  StageInput,
  UpdateImplementationInput,
} from "./implementations.schemas.js";
import {
  buildImplementationSnapshot,
  listReferencedFormTemplateIds,
} from "./implementations.snapshot.js";
import {
  toCatalogTemplate,
  toImplementationDetail,
  toImplementationSummary,
  toUnitContext,
} from "./implementations.presenter.js";

function notFound(message: string, code: string): never {
  throw new ApiError(message, 404, code);
}

export class ImplementationsService {
  private readonly repository = new ImplementationsRepository();

  async create(input: CreateImplementationInput) {
    try {
      const id = await prisma.$transaction(async (tx) => {
        const unit = input.unitId
          ? await this.repository.findUnitContext(input.unitId, tx)
          : null;
        if (input.unitId && !unit) {
          notFound("Unidade não encontrada.", "IMPLEMENTATION_UNIT_NOT_FOUND");
        }

        const organization = resolveOrganization({
          companyId: input.companyId,
          unit,
        });
        const company =
          !unit && organization.companyId
            ? await this.repository.findCompany(organization.companyId, tx)
            : null;
        if (organization.companyId && !unit && !company) {
          notFound("Cliente não encontrado.", "IMPLEMENTATION_COMPANY_NOT_FOUND");
        }

        let snapshot = null;
        if (input.templateId) {
          const template = await this.repository.findTemplateForCopy(input.templateId, tx);
          if (!template) {
            notFound("Template não encontrado.", "IMPLEMENTATION_TEMPLATE_NOT_FOUND");
          }
          assertImplementationTemplatePublished(template.status);
          assertTemplateHasExecutableStructure(template);
          const forms = await this.repository.findFormsForCopy(
            listReferencedFormTemplateIds(template),
            tx,
          );
          snapshot = buildImplementationSnapshot(template, forms);
        }

        const captured = captureFromUnit(organization.companyId, unit);
        if (!unit && company) captured.companyTradeName = company.tradeName;

        const created = await this.repository.createFromSnapshot(tx, {
          name: input.name,
          description: input.description,
          templateId: input.templateId,
          captured,
          snapshot,
        });
        return created.id;
      });

      return this.findById(id);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        (error.code === "P2002" || error.code === "P2003")
      ) {
        throw new ApiError(
          "Não foi possível copiar a estrutura do template.",
          409,
          "IMPLEMENTATION_SNAPSHOT_CONFLICT",
        );
      }
      throw error;
    }
  }

  async findAll(query: ListImplementationsQuery) {
    const page = await this.repository.findPage(query);
    return {
      items: page.items.map(toImplementationSummary),
      page: query.page,
      pageSize: query.pageSize,
      total: page.total,
      totalPages: page.total === 0 ? 0 : Math.ceil(page.total / query.pageSize),
    };
  }

  async findById(id: string) {
    const implementation = await this.repository.findById(id);
    if (!implementation) notFound("Implantação não encontrada.", "IMPLEMENTATION_NOT_FOUND");
    const liveUnit = implementation.unitId
      ? await this.repository.findUnitContext(implementation.unitId)
      : null;
    return toImplementationDetail(implementation, liveUnit);
  }

  async update(id: string, input: UpdateImplementationInput) {
    await this.findById(id);
    await this.repository.update(id, input);
    return this.findById(id);
  }

  async cancel(id: string) {
    const current = await this.repository.findById(id);
    if (!current) notFound("Implantação não encontrada.", "IMPLEMENTATION_NOT_FOUND");
    if (current.status === "CANCELLED") {
      throw new ApiError("A implantação já está cancelada.", 409, "IMPLEMENTATION_ALREADY_CANCELLED");
    }
    await this.repository.cancel(id);
    return this.findById(id);
  }

  async listPublishedTemplates() {
    const templates = await this.repository.findPublishedTemplates();
    return templates.map(toCatalogTemplate);
  }

  async previewTemplate(id: string) {
    const template = await this.repository.findTemplatePreview(id);
    if (!template) notFound("Template não encontrado.", "IMPLEMENTATION_TEMPLATE_NOT_FOUND");
    assertImplementationTemplatePublished(template.status);
    return {
      id: template.id,
      name: template.name,
      description: template.description,
      stages: template.stages.map((stage) => ({
        id: stage.id,
        name: stage.name,
        description: stage.description,
        order: stage.order,
        activities: stage.activities.map((activity) => ({
          id: activity.id,
          name: activity.name,
          description: activity.description,
          order: activity.order,
          requirements: activity.requirements.map((requirement) => ({
            id: requirement.id,
            type: requirement.type,
            isRequired: requirement.isRequired,
          })),
        })),
      })),
    };
  }

  async listUnits(query: CatalogUnitsQuery) {
    const units = await this.repository.findCatalogUnits(query.companyId);
    return units.map(toUnitContext);
  }

  async listCompanies() {
    return this.repository.findCatalogCompanies();
  }

  async createStage(implementationId: string, input: StageInput) {
    return prisma.$transaction(async (tx) => {
      const implementation = await this.repository.findById(implementationId, tx);
      if (!implementation) notFound("Implantação não encontrada.", "IMPLEMENTATION_NOT_FOUND");
      const last = await this.repository.nextStageOrder(implementationId, tx);
      return this.repository.createStage(tx, {
        implementationId,
        name: input.name,
        description: input.description,
        order: (last?.order ?? -1) + 1,
      });
    });
  }

  async updateStage(implementationId: string, stageId: string, input: StageInput) {
    const stage = await this.requireStage(implementationId, stageId);
    return this.repository.updateStage(stage.id, input);
  }

  async deleteStage(implementationId: string, stageId: string) {
    await prisma.$transaction(async (tx) => {
      await this.requireStage(implementationId, stageId, tx);
      await this.repository.deleteStage(tx, stageId, implementationId);
    });
  }

  async reorderStages(implementationId: string, input: ReorderStagesInput) {
    await prisma.$transaction(async (tx) => {
      const implementation = await this.repository.findById(implementationId, tx);
      if (!implementation) notFound("Implantação não encontrada.", "IMPLEMENTATION_NOT_FOUND");
      const stages = await this.repository.listStageIds(implementationId, tx);
      assertSameIdSet(stages.map((stage) => stage.id), input.ids);
      for (const [order, id] of input.ids.entries()) {
        await this.repository.setStageOrder(tx, id, -(order + 1));
      }
      for (const [order, id] of input.ids.entries()) {
        await this.repository.setStageOrder(tx, id, order);
      }
    });
  }

  private async requireStage(
    implementationId: string,
    stageId: string,
    db?: Parameters<ImplementationsRepository["findStage"]>[1],
  ) {
    const stage = await this.repository.findStage(stageId, db);
    if (!stage || stage.implementationId !== implementationId) {
      notFound("Etapa não encontrada.", "IMPLEMENTATION_STAGE_NOT_FOUND");
    }
    return stage;
  }
}
