import { ApiError } from "../../shared/http/api-error.js";

export const FORM_FIELD_TYPES = [
  "TEXT",
  "TEXTAREA",
  "NUMBER",
  "DATE",
  "SINGLE_SELECT",
  "MULTIPLE_SELECT",
  "CHECKBOX",
  "FILE",
] as const;

export const FORM_TEMPLATE_STATUSES = ["ACTIVE", "INACTIVE"] as const;

export type FormFieldTypeValue = (typeof FORM_FIELD_TYPES)[number];
export type FormTemplateStatusValue = (typeof FORM_TEMPLATE_STATUSES)[number];

export interface FormFieldOption {
  value: string;
  label: string;
}

const SELECT_FIELD_TYPES = new Set<FormFieldTypeValue>([
  "SINGLE_SELECT",
  "MULTIPLE_SELECT",
]);

export function fieldTypeUsesOptions(type: FormFieldTypeValue) {
  return SELECT_FIELD_TYPES.has(type);
}

export function assertFieldOptions(
  type: FormFieldTypeValue,
  options: FormFieldOption[] | null,
) {
  if (fieldTypeUsesOptions(type)) {
    if (!options || options.length === 0) {
      throw new ApiError(
        "Campos de seleção precisam de pelo menos uma opção.",
        422,
        "VALIDATION_ERROR",
      );
    }

    const values = options.map((option) => option.value);

    if (new Set(values).size !== values.length) {
      throw new ApiError(
        "As opções do campo não podem ter valores repetidos.",
        422,
        "VALIDATION_ERROR",
      );
    }

    return options;
  }

  if (options && options.length > 0) {
    throw new ApiError(
      "Opções só podem ser configuradas em campos de seleção.",
      422,
      "VALIDATION_ERROR",
    );
  }

  return null;
}

export function assertFormTemplateCanBeDeleted(linkedRequirements: number) {
  if (linkedRequirements > 0) {
    throw new ApiError(
      "Não é possível excluir este formulário porque ele está associado a requisitos de atividades.",
      409,
      "FORM_TEMPLATE_IN_USE",
    );
  }
}

export function assertFormTemplateIsActive(status: string) {
  if (status !== "ACTIVE") {
    throw new ApiError(
      "O formulário precisa estar ativo para ser associado a uma atividade.",
      422,
      "FORM_TEMPLATE_INACTIVE",
    );
  }
}
