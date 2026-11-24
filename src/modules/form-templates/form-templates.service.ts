import { Prisma } from "../../generated/prisma/client.js";

import { prisma } from "../../database/prisma.js";
import { ApiError } from "../../shared/http/api-error.js";
import { applySequentialOrder } from "../templates/templates.repository.js";
import { assertSameIdSet } from "../templates/templates.rules.js";
import { FormTemplatesRepository } from "./form-templates.repository.js";
import { assertFormTemplateCanBeDeleted } from "./form-templates.rules.js";
import type {
  CreateFormTemplateInput,
  FormFieldInput,
  UpdateFormTemplateInput,
  UpdateFormTemplateStatusInput,
} from "./form-templates.schemas.js";

type ReorderFieldsInput = { ids: string[] };

function notFound(message: string, code: string): never {
  throw new ApiError(message, 404, code);
}

function toOptions(
  options: FormFieldInput["options"],
): Prisma.InputJsonValue | typeof Prisma.DbNull {
  if (options === null) return Prisma.DbNull;
  return options as unknown as Prisma.InputJsonValue;
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
        "Já existe um campo com a mesma chave ou ordem neste formulário.",
        409,
        "ORDER_CONFLICT",
      );
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      throw new ApiError(
        "Não é possível excluir este formulário porque ele está associado a requisitos de atividades.",
        409,
        "FORM_TEMPLATE_IN_USE",
      );
    }

    throw error;
  }
}

export class FormTemplatesService {
  private readonly repository = new FormTemplatesRepository();

  create(data: CreateFormTemplateInput) {
    return this.repository.create(data);
  }

  async findAll(status?: CreateFormTemplateInput["status"]) {
    const forms = await this.repository.findMany(status);

    return forms.map((form) => ({
      id: form.id,
      name: form.name,
      description: form.description,
      status: form.status,
      createdAt: form.createdAt,
      updatedAt: form.updatedAt,
      fieldCount: form._count.fields,
      requirementCount: form._count.requirements,
    }));
  }

  async findById(id: string) {
    const formTemplate = await this.repository.findById(id);

    if (!formTemplate) {
      notFound("Formulário não encontrado.", "FORM_TEMPLATE_NOT_FOUND");
    }

    return formTemplate;
  }

  async update(id: string, data: UpdateFormTemplateInput) {
    await this.findById(id);
    return this.repository.update(id, data);
  }

  async updateStatus(id: string, data: UpdateFormTemplateStatusInput) {
    await this.findById(id);
    return this.repository.updateStatus(id, data.status);
  }

  async delete(id: string) {
    await this.findById(id);
    const linkedRequirements = await this.repository.countRequirements(id);
    assertFormTemplateCanBeDeleted(linkedRequirements);
    await withConflict(() => this.repository.delete(id));
  }

  async createField(formTemplateId: string, data: FormFieldInput) {
    return withConflict(() => prisma.$transaction(async (tx) => {
      const formTemplate = await tx.formTemplate.findUnique({
        where: { id: formTemplateId },
        select: { id: true },
      });

      if (!formTemplate) {
        notFound("Formulário não encontrado.", "FORM_TEMPLATE_NOT_FOUND");
      }

      const last = await this.repository.nextFieldOrder(formTemplateId, tx);

      return this.repository.createField(tx, {
        formTemplateId,
        key: data.key,
        label: data.label,
        description: data.description,
        type: data.type,
        placeholder: data.placeholder,
        isRequired: data.isRequired,
        order: (last?.order ?? -1) + 1,
        options: toOptions(data.options),
      });
    }));
  }

  async updateField(
    formTemplateId: string,
    fieldId: string,
    data: FormFieldInput,
  ) {
    await this.requireField(formTemplateId, fieldId);

    return withConflict(() => this.repository.updateField(prisma, fieldId, {
      key: data.key,
      label: data.label,
      description: data.description,
      type: data.type,
      placeholder: data.placeholder,
      isRequired: data.isRequired,
      options: toOptions(data.options),
    }));
  }

  async deleteField(formTemplateId: string, fieldId: string) {
    await this.requireField(formTemplateId, fieldId);
    await this.repository.deleteField(fieldId);
  }

  async reorderFields(formTemplateId: string, data: ReorderFieldsInput) {
    await withConflict(() => prisma.$transaction(async (tx) => {
      const formTemplate = await tx.formTemplate.findUnique({
        where: { id: formTemplateId },
        select: { id: true },
      });

      if (!formTemplate) {
        notFound("Formulário não encontrado.", "FORM_TEMPLATE_NOT_FOUND");
      }

      const fields = await this.repository.listFieldIds(formTemplateId, tx);
      assertSameIdSet(
        fields.map((field) => field.id),
        data.ids,
      );
      await applySequentialOrder(data.ids, (id, order) =>
        this.repository.setFieldOrder(tx, id, order),
      );
    }));
  }

  private async requireField(formTemplateId: string, fieldId: string) {
    const field = await this.repository.findField(fieldId);

    if (!field || field.formTemplateId !== formTemplateId) {
      notFound("Campo não encontrado.", "FORM_FIELD_NOT_FOUND");
    }

    return field;
  }
}
