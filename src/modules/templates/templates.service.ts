import { Prisma } from "../../generated/prisma/client.js";

import { prisma } from "../../database/prisma.js";
import { ApiError } from "../../shared/http/api-error.js";
import { assertFormTemplateIsActive } from "../form-templates/form-templates.rules.js";
import {
  applySequentialOrder,
  TemplatesRepository,
} from "./templates.repository.js";
import {
  assertSameIdSet,
  assertTemplatePublishable,
  type TemplateStatusValue,
} from "./templates.rules.js";
import type {
  CreateActivityInput,
  CreateStageInput,
  CreateTemplateInput,
  ReorderInput,
  RequirementInput,
  UpdateActivityInput,
  UpdateStageInput,
  UpdateTemplateInput,
} from "./templates.schemas.js";

function notFound(message: string, code: string): never {
  throw new ApiError(message, 404, code);
}

function toConfiguration(
  configuration: RequirementInput["configuration"],
): Prisma.InputJsonValue | typeof Prisma.DbNull {
  if (configuration === null) return Prisma.DbNull;
  return configuration as Prisma.InputJsonValue;
}

async function withConflict<T>(action: () => Promise<T>) {
  try {
    return await action();
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new ApiError(
        "Já existe um item com a mesma ordem ou identificador neste grupo.",
        409,
        "ORDER_CONFLICT",
      );
    }

    throw error;
  }
}

export class TemplatesService {
  private readonly repository = new TemplatesRepository();

  async create(data: CreateTemplateInput) {
    return this.repository.create(data);
  }

  async findAll(status?: TemplateStatusValue) {
    const templates = await this.repository.findMany(status);

    return templates.map((template) => ({
      id: template.id,
      name: template.name,
      description: template.description,
      status: template.status,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
      stageCount: template.stages.length,
      activityCount: template.stages.reduce(
        (total, stage) => total + stage._count.activities,
        0,
      ),
    }));
  }

  async findById(id: string) {
    const template = await this.repository.findById(id);

    if (!template) {
      notFound("Template não encontrado.", "TEMPLATE_NOT_FOUND");
    }

    return template;
  }

  async update(id: string, data: UpdateTemplateInput) {
    await this.findById(id);
    return this.repository.update(id, data);
  }

  async updateStatus(id: string, status: TemplateStatusValue) {
    return prisma.$transaction(async (tx) => {
      const current = await this.repository.findById(id, tx);

      if (!current) {
        notFound("Template não encontrado.", "TEMPLATE_NOT_FOUND");
      }

      if (status === "PUBLISHED") {
        assertTemplatePublishable(current);
      }

      return this.repository.updateStatus(id, status, tx);
    });
  }

  async delete(id: string) {
    await this.findById(id);
    await this.repository.delete(id);
  }

  async createStage(templateId: string, data: CreateStageInput) {
    return withConflict(() => prisma.$transaction(async (tx) => {
      await this.requireTemplate(templateId, tx);
      const last = await this.repository.nextStageOrder(templateId, tx);
      const stage = await this.repository.createStage(tx, {
        templateId,
        name: data.name,
        description: data.description,
        order: (last?.order ?? -1) + 1,
      });
      await this.ensurePublishedStructure(templateId, tx);
      return stage;
    }));
  }

  async updateStage(
    templateId: string,
    stageId: string,
    data: UpdateStageInput,
  ) {
    return prisma.$transaction(async (tx) => {
      await this.requireStage(templateId, stageId, tx);
      return this.repository.updateStage(tx, stageId, data);
    });
  }

  async deleteStage(templateId: string, stageId: string) {
    await prisma.$transaction(async (tx) => {
      await this.requireStage(templateId, stageId, tx);
      await this.repository.deleteStage(tx, stageId);
      await this.ensurePublishedStructure(templateId, tx);
    });
  }

  async reorderStages(templateId: string, data: ReorderInput) {
    await withConflict(() => prisma.$transaction(async (tx) => {
      await this.requireTemplate(templateId, tx);
      const stages = await this.repository.listStageIds(templateId, tx);
      assertSameIdSet(
        stages.map((stage) => stage.id),
        data.ids,
      );
      await applySequentialOrder(data.ids, (id, order) =>
        this.repository.setStageOrder(tx, id, order),
      );
    }));
  }

  async createActivity(
    templateId: string,
    stageId: string,
    data: CreateActivityInput,
  ) {
    return withConflict(() => prisma.$transaction(async (tx) => {
      await this.requireStage(templateId, stageId, tx);
      const last = await this.repository.nextActivityOrder(stageId, tx);
      const activity = await this.repository.createActivity(tx, {
        stageId,
        name: data.name,
        description: data.description,
        order: (last?.order ?? -1) + 1,
      });
      await this.ensurePublishedStructure(templateId, tx);
      return activity;
    }));
  }

  async updateActivity(
    templateId: string,
    stageId: string,
    activityId: string,
    data: UpdateActivityInput,
  ) {
    return prisma.$transaction(async (tx) => {
      await this.requireActivity(templateId, stageId, activityId, tx);
      return this.repository.updateActivity(tx, activityId, data);
    });
  }

  async deleteActivity(
    templateId: string,
    stageId: string,
    activityId: string,
  ) {
    await prisma.$transaction(async (tx) => {
      await this.requireActivity(templateId, stageId, activityId, tx);
      await this.repository.deleteActivity(tx, activityId);
      await this.ensurePublishedStructure(templateId, tx);
    });
  }

  async reorderActivities(
    templateId: string,
    stageId: string,
    data: ReorderInput,
  ) {
    await withConflict(() => prisma.$transaction(async (tx) => {
      await this.requireStage(templateId, stageId, tx);
      const activities = await this.repository.listActivityIds(stageId, tx);
      assertSameIdSet(
        activities.map((activity) => activity.id),
        data.ids,
      );
      await applySequentialOrder(data.ids, (id, order) =>
        this.repository.setActivityOrder(tx, id, order),
      );
    }));
  }

  async createRequirement(
    templateId: string,
    stageId: string,
    activityId: string,
    data: RequirementInput,
  ) {
    return withConflict(() => prisma.$transaction(async (tx) => {
      await this.requireActivity(templateId, stageId, activityId, tx);
      await this.requireActiveForm(data.formTemplateId, tx);
      const last = await this.repository.nextRequirementOrder(activityId, tx);

      const requirement = await this.repository.createRequirement(tx, {
        activityId,
        type: data.type,
        isRequired: data.isRequired,
        order: (last?.order ?? -1) + 1,
        configuration: toConfiguration(data.configuration),
        formTemplateId: data.formTemplateId,
        evidenceTypes: data.evidenceTypes,
      });

      await this.ensurePublishedStructure(templateId, tx);
      return requirement;
    }));
  }

  async updateRequirement(
    templateId: string,
    stageId: string,
    activityId: string,
    requirementId: string,
    data: RequirementInput,
  ) {
    return prisma.$transaction(async (tx) => {
      await this.requireRequirement(
        templateId,
        stageId,
        activityId,
        requirementId,
        tx,
      );
      await this.requireActiveForm(data.formTemplateId, tx);

      const requirement = await this.repository.replaceRequirement(
        tx,
        requirementId,
        {
          type: data.type,
          isRequired: data.isRequired,
          configuration: toConfiguration(data.configuration),
          formTemplateId: data.formTemplateId,
          evidenceTypes: data.evidenceTypes,
        },
      );

      await this.ensurePublishedStructure(templateId, tx);
      return requirement;
    });
  }

  async deleteRequirement(
    templateId: string,
    stageId: string,
    activityId: string,
    requirementId: string,
  ) {
    await prisma.$transaction(async (tx) => {
      await this.requireRequirement(
        templateId,
        stageId,
        activityId,
        requirementId,
        tx,
      );
      await this.repository.deleteRequirement(tx, requirementId);
      await this.ensurePublishedStructure(templateId, tx);
    });
  }

  async reorderRequirements(
    templateId: string,
    stageId: string,
    activityId: string,
    data: ReorderInput,
  ) {
    await withConflict(() => prisma.$transaction(async (tx) => {
      await this.requireActivity(templateId, stageId, activityId, tx);
      const requirements = await this.repository.listRequirementIds(
        activityId,
        tx,
      );
      assertSameIdSet(
        requirements.map((requirement) => requirement.id),
        data.ids,
      );
      await applySequentialOrder(data.ids, (id, order) =>
        this.repository.setRequirementOrder(tx, id, order),
      );
    }));
  }

  private async requireTemplate(templateId: string, db: Prisma.TransactionClient) {
    const template = await this.repository.findById(templateId, db);

    if (!template) {
      notFound("Template não encontrado.", "TEMPLATE_NOT_FOUND");
    }

    return template;
  }

  private async requireStage(
    templateId: string,
    stageId: string,
    db: Prisma.TransactionClient,
  ) {
    const stage = await this.repository.findStage(stageId, db);

    if (!stage || stage.templateId !== templateId) {
      notFound("Etapa não encontrada.", "TEMPLATE_STAGE_NOT_FOUND");
    }

    return stage;
  }

  private async requireActivity(
    templateId: string,
    stageId: string,
    activityId: string,
    db: Prisma.TransactionClient,
  ) {
    const activity = await this.repository.findActivity(activityId, db);

    if (
      !activity ||
      activity.stageId !== stageId ||
      activity.stage.templateId !== templateId
    ) {
      notFound("Atividade não encontrada.", "TEMPLATE_ACTIVITY_NOT_FOUND");
    }

    return activity;
  }

  private async requireRequirement(
    templateId: string,
    stageId: string,
    activityId: string,
    requirementId: string,
    db: Prisma.TransactionClient,
  ) {
    const requirement = await this.repository.findRequirement(requirementId, db);

    if (
      !requirement ||
      requirement.activityId !== activityId ||
      requirement.activity.stageId !== stageId ||
      requirement.activity.stage.templateId !== templateId
    ) {
      notFound("Requisito não encontrado.", "ACTIVITY_REQUIREMENT_NOT_FOUND");
    }

    return requirement;
  }

  private async requireActiveForm(
    formTemplateId: string | null,
    db: Prisma.TransactionClient,
  ) {
    if (!formTemplateId) return;

    const formTemplate = await this.repository.findFormTemplate(
      formTemplateId,
      db,
    );

    if (!formTemplate) {
      notFound("Formulário não encontrado.", "FORM_TEMPLATE_NOT_FOUND");
    }

    assertFormTemplateIsActive(formTemplate.status);
  }

  private async ensurePublishedStructure(
    templateId: string,
    db: Prisma.TransactionClient,
  ) {
    const template = await this.repository.findById(templateId, db);

    if (!template) {
      notFound("Template não encontrado.", "TEMPLATE_NOT_FOUND");
    }

    if (template.status === "PUBLISHED") {
      assertTemplatePublishable(template);
    }
  }
}
