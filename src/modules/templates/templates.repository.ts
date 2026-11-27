import { Prisma } from "../../generated/prisma/client.js";

import { prisma } from "../../database/prisma.js";
import type { TemplateStatusValue } from "./templates.rules.js";

const requirementInclude = {
  evidenceTypes: {
    orderBy: { type: "asc" as const },
  },
  formTemplate: {
    select: {
      id: true,
      name: true,
      status: true,
    },
  },
} satisfies Prisma.ActivityRequirementInclude;

export const templateDetailInclude = {
  stages: {
    orderBy: { order: "asc" as const },
    include: {
      activities: {
        orderBy: { order: "asc" as const },
        include: {
          requirements: {
            orderBy: { order: "asc" as const },
            include: requirementInclude,
          },
        },
      },
    },
  },
} satisfies Prisma.TemplateInclude;

const listInclude = {
  stages: {
    select: {
      _count: {
        select: {
          activities: true,
        },
      },
    },
  },
} satisfies Prisma.TemplateInclude;

type Db = Prisma.TransactionClient;

export class TemplatesRepository {
  findMany(status?: TemplateStatusValue) {
    return prisma.template.findMany({
      where: status ? { status } : undefined,
      orderBy: { updatedAt: "desc" },
      include: listInclude,
    });
  }

  findById(id: string, db: Db = prisma) {
    return db.template.findUnique({
      where: { id },
      include: templateDetailInclude,
    });
  }

  create(data: { name: string; description: string | null }) {
    return prisma.template.create({
      data: {
        name: data.name,
        description: data.description,
        status: "DRAFT",
      },
      include: templateDetailInclude,
    });
  }

  update(
    id: string,
    data: { name: string; description: string | null },
  ) {
    return prisma.template.update({
      where: { id },
      data,
      include: templateDetailInclude,
    });
  }

  updateStatus(id: string, status: TemplateStatusValue, db: Db = prisma) {
    return db.template.update({
      where: { id },
      data: { status },
      include: templateDetailInclude,
    });
  }

  delete(id: string) {
    return prisma.template.delete({
      where: { id },
    });
  }

  findStage(id: string, db: Db = prisma) {
    return db.templateStage.findUnique({
      where: { id },
    });
  }

  nextStageOrder(templateId: string, db: Db) {
    return db.templateStage.findFirst({
      where: { templateId },
      orderBy: { order: "desc" },
      select: { order: true },
    });
  }

  createStage(
    db: Db,
    data: {
      templateId: string;
      name: string;
      description: string | null;
      order: number;
    },
  ) {
    return db.templateStage.create({ data });
  }

  updateStage(
    db: Db,
    id: string,
    data: { name: string; description: string | null },
  ) {
    return db.templateStage.update({
      where: { id },
      data,
    });
  }

  deleteStage(db: Db, id: string) {
    return db.templateStage.delete({ where: { id } });
  }

  listStageIds(templateId: string, db: Db) {
    return db.templateStage.findMany({
      where: { templateId },
      select: { id: true },
      orderBy: { order: "asc" },
    });
  }

  setStageOrder(db: Db, id: string, order: number) {
    return db.templateStage.update({
      where: { id },
      data: { order },
    });
  }

  findActivity(id: string, db: Db = prisma) {
    return db.templateActivity.findUnique({
      where: { id },
      include: { stage: true },
    });
  }

  nextActivityOrder(stageId: string, db: Db) {
    return db.templateActivity.findFirst({
      where: { stageId },
      orderBy: { order: "desc" },
      select: { order: true },
    });
  }

  createActivity(
    db: Db,
    data: {
      stageId: string;
      name: string;
      description: string | null;
      order: number;
    },
  ) {
    return db.templateActivity.create({ data });
  }

  updateActivity(
    db: Db,
    id: string,
    data: { name: string; description: string | null },
  ) {
    return db.templateActivity.update({
      where: { id },
      data,
    });
  }

  deleteActivity(db: Db, id: string) {
    return db.templateActivity.delete({ where: { id } });
  }

  listActivityIds(stageId: string, db: Db) {
    return db.templateActivity.findMany({
      where: { stageId },
      select: { id: true },
      orderBy: { order: "asc" },
    });
  }

  setActivityOrder(db: Db, id: string, order: number) {
    return db.templateActivity.update({
      where: { id },
      data: { order },
    });
  }

  findRequirement(id: string, db: Db = prisma) {
    return db.activityRequirement.findUnique({
      where: { id },
      include: {
        activity: {
          include: { stage: true },
        },
      },
    });
  }

  nextRequirementOrder(activityId: string, db: Db) {
    return db.activityRequirement.findFirst({
      where: { activityId },
      orderBy: { order: "desc" },
      select: { order: true },
    });
  }

  createRequirement(
    db: Db,
    data: {
      activityId: string;
      type: Prisma.ActivityRequirementCreateInput["type"];
      isRequired: boolean;
      order: number;
      configuration: Prisma.InputJsonValue | typeof Prisma.DbNull;
      formTemplateId: string | null;
      evidenceTypes: string[];
    },
  ) {
    return db.activityRequirement.create({
      data: {
        activityId: data.activityId,
        type: data.type,
        isRequired: data.isRequired,
        order: data.order,
        configuration: data.configuration,
        formTemplateId: data.formTemplateId,
        evidenceTypes: {
          create: data.evidenceTypes.map((type) => ({ type })),
        },
      },
      include: requirementInclude,
    });
  }

  async replaceRequirement(
    db: Db,
    id: string,
    data: {
      type: Prisma.ActivityRequirementCreateInput["type"];
      isRequired: boolean;
      configuration: Prisma.InputJsonValue | typeof Prisma.DbNull;
      formTemplateId: string | null;
      evidenceTypes: string[];
    },
  ) {
    await db.activityRequirementEvidenceType.deleteMany({
      where: { requirementId: id },
    });

    return db.activityRequirement.update({
      where: { id },
      data: {
        type: data.type,
        isRequired: data.isRequired,
        configuration: data.configuration,
        formTemplateId: data.formTemplateId,
        evidenceTypes: {
          create: data.evidenceTypes.map((type) => ({ type })),
        },
      },
      include: requirementInclude,
    });
  }

  deleteRequirement(db: Db, id: string) {
    return db.activityRequirement.delete({ where: { id } });
  }

  listRequirementIds(activityId: string, db: Db) {
    return db.activityRequirement.findMany({
      where: { activityId },
      select: { id: true },
      orderBy: { order: "asc" },
    });
  }

  setRequirementOrder(db: Db, id: string, order: number) {
    return db.activityRequirement.update({
      where: { id },
      data: { order },
    });
  }

  findFormTemplate(id: string, db: Db = prisma) {
    return db.formTemplate.findUnique({
      where: { id },
      select: { id: true, status: true },
    });
  }
}

export async function applySequentialOrder(
  ids: string[],
  updateOrder: (id: string, order: number) => Promise<unknown>,
) {
  for (let index = 0; index < ids.length; index += 1) {
    const id = ids[index];

    if (!id) continue;

    await updateOrder(id, -(index + 1));
  }

  for (let index = 0; index < ids.length; index += 1) {
    const id = ids[index];

    if (!id) continue;

    await updateOrder(id, index);
  }
}
