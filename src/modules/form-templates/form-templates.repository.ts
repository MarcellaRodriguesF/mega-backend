import { Prisma } from "../../generated/prisma/client.js";

import { prisma } from "../../database/prisma.js";
import type { FormTemplateStatusValue } from "./form-templates.rules.js";
import type { FormFieldOption } from "./form-templates.rules.js";

const formTemplateInclude = {
  fields: {
    orderBy: { order: "asc" as const },
  },
  _count: {
    select: {
      requirements: true,
    },
  },
} satisfies Prisma.FormTemplateInclude;

type Db = Prisma.TransactionClient | typeof prisma;

export class FormTemplatesRepository {
  findMany(status?: FormTemplateStatusValue) {
    return prisma.formTemplate.findMany({
      where: status ? { status } : undefined,
      orderBy: { updatedAt: "desc" },
      include: {
        _count: {
          select: {
            fields: true,
            requirements: true,
          },
        },
      },
    });
  }

  findById(id: string) {
    return prisma.formTemplate.findUnique({
      where: { id },
      include: formTemplateInclude,
    });
  }

  create(data: {
    name: string;
    description: string | null;
    status: FormTemplateStatusValue;
  }) {
    return prisma.formTemplate.create({
      data,
      include: formTemplateInclude,
    });
  }

  update(
    id: string,
    data: { name: string; description: string | null },
  ) {
    return prisma.formTemplate.update({
      where: { id },
      data,
      include: formTemplateInclude,
    });
  }

  updateStatus(id: string, status: FormTemplateStatusValue) {
    return prisma.formTemplate.update({
      where: { id },
      data: { status },
      include: formTemplateInclude,
    });
  }

  countRequirements(id: string) {
    return prisma.activityRequirement.count({
      where: { formTemplateId: id },
    });
  }

  delete(id: string) {
    return prisma.formTemplate.delete({
      where: { id },
    });
  }

  findField(id: string) {
    return prisma.formField.findUnique({
      where: { id },
    });
  }

  nextFieldOrder(formTemplateId: string, db: Db) {
    return db.formField.findFirst({
      where: { formTemplateId },
      orderBy: { order: "desc" },
      select: { order: true },
    });
  }

  createField(
    db: Db,
    data: {
      formTemplateId: string;
      key: string;
      label: string;
      description: string | null;
      type: Prisma.FormFieldCreateInput["type"];
      placeholder: string | null;
      isRequired: boolean;
      order: number;
      options: Prisma.InputJsonValue | typeof Prisma.DbNull;
    },
  ) {
    return db.formField.create({ data });
  }

  updateField(
    db: Db,
    id: string,
    data: {
      key: string;
      label: string;
      description: string | null;
      type: Prisma.FormFieldCreateInput["type"];
      placeholder: string | null;
      isRequired: boolean;
      options: Prisma.InputJsonValue | typeof Prisma.DbNull;
    },
  ) {
    return db.formField.update({
      where: { id },
      data,
    });
  }

  deleteField(id: string) {
    return prisma.formField.delete({ where: { id } });
  }

  listFieldIds(formTemplateId: string, db: Db) {
    return db.formField.findMany({
      where: { formTemplateId },
      select: { id: true },
      orderBy: { order: "asc" },
    });
  }

  setFieldOrder(db: Db, id: string, order: number) {
    return db.formField.update({
      where: { id },
      data: { order },
    });
  }
}
