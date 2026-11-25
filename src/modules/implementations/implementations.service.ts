import { Prisma } from "../../generated/prisma/client.js";

import { prisma } from "../../database/prisma.js";
import { ApiError } from "../../shared/http/api-error.js";
import {
  toCatalogTemplate,
  toImplementationDetail,
  toImplementationSummary,
  toUnitContext,
} from "./implementations.presenter.js";
import { ImplementationsRepository } from "./implementations.repository.js";
import {
  assertImplementationTemplatePublished,
  assertTemplateHasExecutableStructure,
} from "./implementations.rules.js";
import type {
  CatalogUnitsQuery,
  CreateImplementationInput,
  ListImplementationsQuery,
} from "./implementations.schemas.js";
import {
  buildImplementationSnapshot,
  listReferencedFormTemplateIds,
} from "./implementations.snapshot.js";

function notFound(message: string, code: string): never {
  throw new ApiError(message, 404, code);
}

export class ImplementationsService {
  private readonly repository = new ImplementationsRepository();

  async create(input: CreateImplementationInput) {
    try {
      return await this.createFromPublishedTemplate(input);
    } catch (error) {
      if (error instanceof ApiError) throw error;

      if (isSnapshotConflict(error)) {
        throw new ApiError(
          "Não foi possível copiar a estrutura do template.",
          409,
          "IMPLEMENTATION_SNAPSHOT_CONFLICT",
        );
      }

      throw error;
    }
  }

  private async createFromPublishedTemplate(input: CreateImplementationInput) {
    const id = await prisma.$transaction(async (tx) => {
      const template = await this.repository.findTemplateForCopy(input.templateId, tx);

      if (!template) {
        notFound(
          "Template não encontrado.",
          "IMPLEMENTATION_TEMPLATE_NOT_FOUND",
        );
      }

      assertImplementationTemplatePublished(template.status);
      assertTemplateHasExecutableStructure(template);

      const unit = await this.repository.findUnitContext(input.unitId, tx);

      if (!unit) {
        notFound("Unidade não encontrada.", "IMPLEMENTATION_UNIT_NOT_FOUND");
      }

      const formIds = listReferencedFormTemplateIds(template);
      const forms = await this.repository.findFormsForCopy(formIds, tx);
      const snapshot = buildImplementationSnapshot(template, forms);
      const created = await this.repository.createFromSnapshot(tx, {
        unit,
        templateId: template.id,
        snapshot,
      });

      return created.id;
    });

    return this.findById(id);
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

    if (!implementation) {
      notFound("Implantação não encontrada.", "IMPLEMENTATION_NOT_FOUND");
    }

    const liveUnit = await this.repository.findUnitContext(implementation.unitId);

    return toImplementationDetail(implementation, liveUnit);
  }

  async listPublishedTemplates() {
    const templates = await this.repository.findPublishedTemplates();
    return templates.map(toCatalogTemplate);
  }

  async listUnits(query: CatalogUnitsQuery) {
    const units = await this.repository.findCatalogUnits(query.companyId);
    return units.map(toUnitContext);
  }
}

export function isSnapshotConflict(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === "P2002" || error.code === "P2003")
  );
}
