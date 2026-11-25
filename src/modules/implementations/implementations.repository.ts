import { randomUUID } from "node:crypto";

import { Prisma } from "../../generated/prisma/client.js";
import type {
  ActivityRequirementType,
  FormFieldType,
} from "../../generated/prisma/enums.js";

import { prisma } from "../../database/prisma.js";
import { ApiError } from "../../shared/http/api-error.js";
import type { ImplementationSnapshot } from "./implementations.snapshot.js";
import type { ListImplementationsQuery } from "./implementations.schemas.js";
import { resolveInitialProvider } from "./implementations.rules.js";

const templateForCopyInclude = {
  stages: {
    orderBy: { order: "asc" as const },
    include: {
      activities: {
        orderBy: { order: "asc" as const },
        include: {
          requirements: {
            orderBy: { order: "asc" as const },
            include: { evidenceTypes: { orderBy: { type: "asc" as const } } },
          },
        },
      },
    },
  },
} satisfies Prisma.TemplateInclude;

export const activeConnectivitySelect = {
  id: true,
  name: true,
  technology: true,
  downloadCapacityMbps: true,
  uploadCapacityMbps: true,
  responseTimeMs: true,
  throughputMbps: true,
  rxSignalDbm: true,
  publicIp: true,
  gatewayIp: true,
  localIp: true,
  wanIp: true,
  networkName: true,
  slaPercentage: true,
  mttrHours: true,
  monitoringEnabled: true,
  serviceStartDate: true,
  serviceEndDate: true,
  observations: true,
  status: true,
  provider: { select: { id: true, name: true } },
} satisfies Prisma.UnitConnectivitySelect;

const addressSelect = {
  zipCode: true,
  street: true,
  number: true,
  complement: true,
  neighborhood: true,
  city: true,
  state: true,
} satisfies Prisma.UnitAddressSelect;

export const unitContextSelect = {
  id: true,
  name: true,
  type: true,
  status: true,
  companyId: true,
  company: { select: { id: true, tradeName: true } },
  address: { select: addressSelect },
  connectivities: {
    where: { status: "ACTIVE" },
    orderBy: { updatedAt: "desc" as const },
    take: 1,
    select: activeConnectivitySelect,
  },
} satisfies Prisma.UnitSelect;

const activityInclude = {
  assignments: {
    orderBy: { createdAt: "asc" as const },
    select: { id: true, userId: true, userName: true, role: true, createdAt: true },
  },
  requirements: {
    orderBy: { order: "asc" as const },
    include: {
      evidenceTypes: { orderBy: { type: "asc" as const } },
      formSnapshot: { select: { id: true, name: true, sourceFormTemplateId: true } },
    },
  },
  formSnapshots: {
    orderBy: { name: "asc" as const },
    include: { fields: { orderBy: { order: "asc" as const } } },
  },
} satisfies Prisma.ActivityInclude;

export const implementationDetailInclude = {
  stages: {
    orderBy: { order: "asc" as const },
    include: {
      activities: {
        orderBy: { order: "asc" as const },
        include: activityInclude,
      },
    },
  },
  activities: {
    where: { stageId: null },
    orderBy: { order: "asc" as const },
    include: activityInclude,
  },
} satisfies Prisma.ImplementationInclude;

type Db = Prisma.TransactionClient | typeof prisma;

function jsonOrNull(value: unknown): Prisma.InputJsonValue | typeof Prisma.DbNull {
  if (value === null || value === undefined) return Prisma.DbNull;
  return value as Prisma.InputJsonValue;
}

function requiredId(map: Map<string, string>, key: string) {
  const id = map.get(key);
  if (!id) {
    throw new ApiError(
      "Não foi possível vincular o formulário copiado.",
      422,
      "FORM_SNAPSHOT_SOURCE_MISSING",
    );
  }
  return id;
}

export interface CapturedContext {
  companyId: string | null;
  unitId: string | null;
  unitName: string | null;
  companyTradeName: string | null;
  addressZipCode: string | null;
  addressStreet: string | null;
  addressNumber: string | null;
  addressComplement: string | null;
  addressNeighborhood: string | null;
  addressCity: string | null;
  addressState: string | null;
  initialProviderId: string | null;
  initialProviderName: string | null;
}

export function captureFromUnit(
  companyId: string | null,
  unit: {
    id: string;
    name: string;
    company: { tradeName: string };
    address: {
      zipCode: string | null;
      street: string | null;
      number: string | null;
      complement: string | null;
      neighborhood: string | null;
      city: string | null;
      state: string | null;
    } | null;
    connectivities: { provider: { id: string; name: string } | null }[];
  } | null,
): CapturedContext {
  const provider = resolveInitialProvider(unit?.connectivities[0] ?? null);
  const address = unit?.address;

  return {
    companyId,
    unitId: unit?.id ?? null,
    unitName: unit?.name ?? null,
    companyTradeName: unit?.company.tradeName ?? null,
    addressZipCode: address?.zipCode ?? null,
    addressStreet: address?.street ?? null,
    addressNumber: address?.number ?? null,
    addressComplement: address?.complement ?? null,
    addressNeighborhood: address?.neighborhood ?? null,
    addressCity: address?.city ?? null,
    addressState: address?.state ?? null,
    initialProviderId: provider.initialProviderId,
    initialProviderName: provider.initialProviderName,
  };
}

export class ImplementationsRepository {
  findTemplateForCopy(id: string, db: Db = prisma) {
    return db.template.findUnique({ where: { id }, include: templateForCopyInclude });
  }

  findTemplatePreview(id: string) {
    return prisma.template.findUnique({
      where: { id },
      include: templateForCopyInclude,
    });
  }

  findFormsForCopy(ids: string[], db: Db = prisma) {
    if (ids.length === 0) return Promise.resolve([]);
    return db.formTemplate.findMany({
      where: { id: { in: ids } },
      include: { fields: { orderBy: { order: "asc" } } },
    });
  }

  findUnitContext(id: string, db: Db = prisma) {
    return db.unit.findUnique({ where: { id }, select: unitContextSelect });
  }

  findCompany(id: string, db: Db = prisma) {
    return db.company.findUnique({
      where: { id },
      select: { id: true, tradeName: true },
    });
  }

  findPublishedTemplates() {
    return prisma.template.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        description: true,
        stages: { select: { _count: { select: { activities: true } } } },
      },
    });
  }

  findCatalogUnits(companyId?: string) {
    return prisma.unit.findMany({
      where: companyId ? { companyId } : undefined,
      orderBy: [{ company: { tradeName: "asc" } }, { name: "asc" }],
      select: unitContextSelect,
    });
  }

  findCatalogCompanies() {
    return prisma.company.findMany({
      orderBy: { tradeName: "asc" },
      select: { id: true, tradeName: true },
    });
  }

  async findPage(query: ListImplementationsQuery) {
    const where: Prisma.ImplementationWhereInput = {
      ...(query.unitId ? { unitId: query.unitId } : {}),
      ...(query.companyId ? { companyId: query.companyId } : {}),
      ...(query.status ? { status: query.status } : {}),
    };
    const total = await prisma.implementation.count({ where });
    const items = await prisma.implementation.findMany({
      where,
      orderBy: { startedAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      select: {
        id: true,
        name: true,
        status: true,
        startedAt: true,
        completedAt: true,
        unitId: true,
        unitName: true,
        companyId: true,
        companyTradeName: true,
        templateId: true,
        templateName: true,
        initialProviderId: true,
        initialProviderName: true,
        _count: { select: { stages: true, activities: true } },
      },
    });
    return { total, items };
  }

  findById(id: string, db: Db = prisma) {
    return db.implementation.findUnique({
      where: { id },
      include: implementationDetailInclude,
    });
  }

  createFromSnapshot(
    db: Db,
    input: {
      name: string;
      description: string | null;
      templateId: string | null;
      captured: CapturedContext;
      snapshot: ImplementationSnapshot | null;
    },
  ) {
    const implementationId = randomUUID();
    const template = input.snapshot;

    return db.implementation.create({
      data: {
        id: implementationId,
        name: input.name,
        description: input.description,
        templateId: input.templateId,
        templateName: template?.templateName ?? null,
        templateDescription: template?.templateDescription ?? null,
        ...input.captured,
        status: "IN_PROGRESS",
        stages: {
          create: (template?.stages ?? []).map((stage) => ({
            sourceStageId: stage.sourceStageId,
            name: stage.name,
            description: stage.description,
            order: stage.order,
            status: "NOT_STARTED",
            activities: {
              create: stage.activities.map((activity) =>
                activityData(implementationId, input.captured, activity),
              ),
            },
          })),
        },
      },
      select: { id: true },
    });
  }

  update(
    id: string,
    data: { name: string; description: string | null },
  ) {
    return prisma.implementation.update({ where: { id }, data, select: { id: true } });
  }

  cancel(id: string) {
    return prisma.implementation.update({
      where: { id },
      data: { status: "CANCELLED" },
      select: { id: true },
    });
  }

  listStageIds(implementationId: string, db: Db = prisma) {
    return db.implementationStage.findMany({
      where: { implementationId },
      select: { id: true },
      orderBy: { order: "asc" },
    });
  }

  nextStageOrder(implementationId: string, db: Db) {
    return db.implementationStage.findFirst({
      where: { implementationId },
      orderBy: { order: "desc" },
      select: { order: true },
    });
  }

  createStage(
    db: Db,
    data: { implementationId: string; name: string; description: string | null; order: number },
  ) {
    return db.implementationStage.create({ data: { ...data, status: "NOT_STARTED" } });
  }

  updateStage(
    id: string,
    data: { name: string; description: string | null },
  ) {
    return prisma.implementationStage.update({ where: { id }, data });
  }

  findStage(id: string, db: Db = prisma) {
    return db.implementationStage.findUnique({ where: { id } });
  }

  async deleteStage(db: Db, stageId: string, implementationId: string) {
    const activities = await db.activity.findMany({
      where: { stageId },
      select: { id: true },
      orderBy: { order: "asc" },
    });
    const lastDirect = await db.activity.findFirst({
      where: { implementationId, stageId: null },
      orderBy: { order: "desc" },
      select: { order: true },
    });
    let order = (lastDirect?.order ?? -1) + 1;
    for (const activity of activities) {
      await db.activity.update({
        where: { id: activity.id },
        data: { stageId: null, order },
      });
      order += 1;
    }
    await db.implementationStage.delete({ where: { id: stageId } });
  }

  setStageOrder(db: Db, id: string, order: number) {
    return db.implementationStage.update({ where: { id }, data: { order } });
  }
}

function activityData(
  implementationId: string,
  captured: CapturedContext,
  activity: ImplementationSnapshot["stages"][number]["activities"][number],
) {
  const formIds = new Map(
    activity.forms.map((form) => [form.sourceFormTemplateId, randomUUID()]),
  );

  return {
    implementationId,
    sourceActivityId: activity.sourceActivityId,
    name: activity.name,
    description: activity.description,
    order: activity.order,
    status: "NOT_STARTED" as const,
    ...captured,
    formSnapshots: {
      create: activity.forms.map((form) => ({
        id: requiredId(formIds, form.sourceFormTemplateId),
        sourceFormTemplateId: form.sourceFormTemplateId,
        name: form.name,
        description: form.description,
        status: form.status,
        fields: {
          create: form.fields.map((field) => ({
            sourceFormFieldId: field.sourceFormFieldId,
            key: field.key,
            label: field.label,
            description: field.description,
            type: field.type as FormFieldType,
            placeholder: field.placeholder,
            isRequired: field.isRequired,
            order: field.order,
            options: jsonOrNull(field.options),
            isSensitive: field.isSensitive,
            connectivityFieldTarget: field.connectivityFieldTarget,
          })),
        },
      })),
    },
    requirements: {
      create: activity.requirements.map((requirement) => ({
        sourceRequirementId: requirement.sourceRequirementId,
        type: requirement.type as ActivityRequirementType,
        isRequired: requirement.isRequired,
        order: requirement.order,
        configuration: jsonOrNull(requirement.configuration),
        formSnapshotId: requirement.sourceFormTemplateId
          ? requiredId(formIds, requirement.sourceFormTemplateId)
          : null,
        ...(requirement.evidenceTypes.length > 0
          ? {
              evidenceTypes: {
                create: requirement.evidenceTypes.map((type) => ({ type })),
              },
            }
          : {}),
      })),
    },
  };
}
