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
            include: {
              evidenceTypes: {
                orderBy: { type: "asc" as const },
              },
            },
          },
        },
      },
    },
  },
} satisfies Prisma.TemplateInclude;

const activeConnectivitySelect = {
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
  provider: {
    select: {
      id: true,
      name: true,
    },
  },
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

const unitContextSelect = {
  id: true,
  name: true,
  type: true,
  status: true,
  companyId: true,
  company: {
    select: {
      id: true,
      tradeName: true,
    },
  },
  address: {
    select: addressSelect,
  },
  connectivities: {
    where: { status: "ACTIVE" },
    orderBy: { updatedAt: "desc" as const },
    take: 1,
    select: activeConnectivitySelect,
  },
} satisfies Prisma.UnitSelect;

export const implementationDetailInclude = {
  stages: {
    orderBy: { order: "asc" as const },
    include: {
      activities: {
        orderBy: { order: "asc" as const },
        include: {
          assignments: {
            orderBy: { createdAt: "asc" as const },
            select: {
              id: true,
              userId: true,
              userName: true,
              role: true,
              createdAt: true,
            },
          },
          requirements: {
            orderBy: { order: "asc" as const },
            include: {
              evidenceTypes: {
                orderBy: { type: "asc" as const },
              },
              formSnapshot: {
                select: {
                  id: true,
                  name: true,
                  sourceFormTemplateId: true,
                },
              },
            },
          },
        },
      },
    },
  },
  formSnapshots: {
    orderBy: { name: "asc" as const },
    include: {
      fields: {
        orderBy: { order: "asc" as const },
      },
    },
  },
} satisfies Prisma.ImplementationInclude;

type Db = Prisma.TransactionClient | typeof prisma;

function requiredSnapshotId(formIds: Map<string, string>, sourceFormTemplateId: string) {
  const id = formIds.get(sourceFormTemplateId);

  if (!id) {
    throw new ApiError(
      "Não foi possível vincular o formulário copiado.",
      422,
      "FORM_SNAPSHOT_SOURCE_MISSING",
    );
  }

  return id;
}

function jsonOrNull(value: unknown): Prisma.InputJsonValue | typeof Prisma.DbNull {
  if (value === null || value === undefined) return Prisma.DbNull;
  return value as Prisma.InputJsonValue;
}

export class ImplementationsRepository {
  findTemplateForCopy(id: string, db: Db = prisma) {
    return db.template.findUnique({
      where: { id },
      include: templateForCopyInclude,
    });
  }

  findFormsForCopy(ids: string[], db: Db = prisma) {
    if (ids.length === 0) return Promise.resolve([]);

    return db.formTemplate.findMany({
      where: { id: { in: ids } },
      include: {
        fields: {
          orderBy: { order: "asc" },
        },
      },
    });
  }

  findUnitContext(id: string, db: Db = prisma) {
    return db.unit.findUnique({
      where: { id },
      select: unitContextSelect,
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
        stages: {
          select: {
            _count: {
              select: { activities: true },
            },
          },
        },
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
          stages: {
            select: {
              _count: {
                select: { activities: true },
              },
            },
          },
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
      unit: {
        id: string;
        name: string;
        companyId: string;
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
        connectivities: {
          provider: { id: string; name: string } | null;
        }[];
      };
      templateId: string;
      snapshot: ImplementationSnapshot;
    },
  ) {
    const provider = resolveInitialProvider(input.unit.connectivities[0] ?? null);
    const formIds = new Map(
      input.snapshot.forms.map((form) => [form.sourceFormTemplateId, randomUUID()]),
    );
    const address = input.unit.address;

    return db.implementation.create({
      data: {
        unitId: input.unit.id,
        companyId: input.unit.companyId,
        templateId: input.templateId,
        templateName: input.snapshot.templateName,
        templateDescription: input.snapshot.templateDescription,
        unitName: input.unit.name,
        companyTradeName: input.unit.company.tradeName,
        addressZipCode: address?.zipCode ?? null,
        addressStreet: address?.street ?? null,
        addressNumber: address?.number ?? null,
        addressComplement: address?.complement ?? null,
        addressNeighborhood: address?.neighborhood ?? null,
        addressCity: address?.city ?? null,
        addressState: address?.state ?? null,
        initialProviderId: provider.initialProviderId,
        initialProviderName: provider.initialProviderName,
        status: "IN_PROGRESS",
        formSnapshots: {
          create: input.snapshot.forms.map((form) => ({
            id: requiredSnapshotId(formIds, form.sourceFormTemplateId),
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
        stages: {
          create: input.snapshot.stages.map((stage) => ({
            sourceStageId: stage.sourceStageId,
            name: stage.name,
            description: stage.description,
            order: stage.order,
            status: "NOT_STARTED",
            activities: {
              create: stage.activities.map((activity) => ({
                sourceActivityId: activity.sourceActivityId,
                name: activity.name,
                description: activity.description,
                order: activity.order,
                status: "NOT_STARTED",
                requirements: {
                  create: activity.requirements.map((requirement) => ({
                    sourceRequirementId: requirement.sourceRequirementId,
                    type: requirement.type as ActivityRequirementType,
                    isRequired: requirement.isRequired,
                    order: requirement.order,
                    configuration: jsonOrNull(requirement.configuration),
                    formSnapshotId: requirement.sourceFormTemplateId
                      ? requiredSnapshotId(formIds, requirement.sourceFormTemplateId)
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
              })),
            },
          })),
        },
      },
      select: { id: true },
    });
  }
}
