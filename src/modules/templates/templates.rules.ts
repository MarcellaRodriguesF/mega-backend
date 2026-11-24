import { ApiError } from "../../shared/http/api-error.js";

export const TEMPLATE_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;

export const ACTIVITY_REQUIREMENT_TYPES = [
  "EVIDENCE",
  "FORM",
  "QUANTITY",
  "COMMENT",
  "ENGINEER_APPROVAL",
  "DAILY_REPORT",
  "COMPLETION_PERCENTAGE",
] as const;

export type TemplateStatusValue = (typeof TEMPLATE_STATUSES)[number];
export type ActivityRequirementTypeValue =
  (typeof ACTIVITY_REQUIREMENT_TYPES)[number];

export interface QuantityConfiguration {
  unit: string | null;
  plannedQuantity: number | null;
}

export interface CompletionPercentageConfiguration {
  minimumPercentage: number;
}

export interface PublishableRequirement {
  type: string;
  isRequired: boolean;
  evidenceTypes: { type: string }[];
  formTemplate: { status: string } | null;
  configuration: unknown;
}

export interface PublishableTemplate {
  stages: {
    activities: {
      requirements: PublishableRequirement[];
    }[];
  }[];
}

export function normalizeEvidenceTypes(types: string[]): string[] {
  const normalized = types.map((type) => type.trim().toUpperCase());

  if (normalized.some((type) => type.length === 0 || type.length > 50)) {
    throw new ApiError(
      "Cada tipo de evidência deve ter entre 1 e 50 caracteres.",
      422,
      "VALIDATION_ERROR",
    );
  }

  if (new Set(normalized).size !== normalized.length) {
    throw new ApiError(
      "Os tipos de evidência não podem se repetir no mesmo requisito.",
      422,
      "VALIDATION_ERROR",
    );
  }

  return normalized;
}

export function assertEvidenceRequirement(
  isRequired: boolean,
  evidenceTypes: string[],
) {
  const normalized = normalizeEvidenceTypes(evidenceTypes);

  if (isRequired && normalized.length === 0) {
    throw new ApiError(
      "Um requisito de evidência obrigatório precisa de pelo menos um tipo de arquivo.",
      422,
      "VALIDATION_ERROR",
    );
  }

  return normalized;
}

export function assertQuantityConfiguration(
  configuration: QuantityConfiguration,
  isRequired: boolean,
) {
  if (configuration.plannedQuantity !== null) {
    if (
      !Number.isFinite(configuration.plannedQuantity) ||
      configuration.plannedQuantity <= 0
    ) {
      throw new ApiError(
        "A quantidade planejada deve ser um número maior que zero.",
        422,
        "VALIDATION_ERROR",
      );
    }
  }

  if (isRequired) {
    if (!configuration.unit) {
      throw new ApiError(
        "Informe a unidade de medida do requisito de quantidade obrigatório.",
        422,
        "VALIDATION_ERROR",
      );
    }

    if (configuration.plannedQuantity === null) {
      throw new ApiError(
        "Informe a quantidade planejada do requisito de quantidade obrigatório.",
        422,
        "VALIDATION_ERROR",
      );
    }
  }

  return configuration;
}

export function assertCompletionPercentage(value: number) {
  if (!Number.isFinite(value) || value < 0 || value > 100) {
    throw new ApiError(
      "O percentual mínimo deve estar entre 0 e 100.",
      422,
      "VALIDATION_ERROR",
    );
  }

  return value;
}

export function assertSameIdSet(currentIds: string[], orderedIds: string[]) {
  if (orderedIds.length !== currentIds.length) {
    throw new ApiError(
      "A reordenação deve incluir todos os itens do mesmo nível.",
      422,
      "VALIDATION_ERROR",
    );
  }

  if (new Set(orderedIds).size !== orderedIds.length) {
    throw new ApiError(
      "A reordenação contém itens duplicados.",
      422,
      "VALIDATION_ERROR",
    );
  }

  const current = new Set(currentIds);

  for (const id of orderedIds) {
    if (!current.has(id)) {
      throw new ApiError(
        "A reordenação contém um item que não pertence a este grupo.",
        422,
        "VALIDATION_ERROR",
      );
    }
  }
}

function assertStoredRequirement(requirement: PublishableRequirement) {
  if (requirement.type === "EVIDENCE") {
    assertEvidenceRequirement(
      requirement.isRequired,
      requirement.evidenceTypes.map((item) => item.type),
    );
  }

  if (requirement.type === "FORM") {
    if (!requirement.formTemplate) {
      throw new ApiError(
        "O requisito de formulário precisa de um formulário válido.",
        422,
        "TEMPLATE_STRUCTURE_INVALID",
      );
    }

    if (requirement.isRequired && requirement.formTemplate.status !== "ACTIVE") {
      throw new ApiError(
        "Não é possível publicar um template com formulário inativo em um requisito obrigatório.",
        422,
        "TEMPLATE_STRUCTURE_INVALID",
      );
    }

    if (requirement.formTemplate.status !== "ACTIVE") {
      throw new ApiError(
        "O formulário associado ao requisito precisa estar ativo.",
        422,
        "FORM_TEMPLATE_INACTIVE",
      );
    }
  }

  if (requirement.type === "QUANTITY") {
    const configuration = readQuantityConfiguration(requirement.configuration);
    assertQuantityConfiguration(configuration, requirement.isRequired);
  }

  if (requirement.type === "COMPLETION_PERCENTAGE") {
    assertCompletionPercentage(
      readCompletionPercentage(requirement.configuration),
    );
  }
}

export function assertTemplatePublishable(template: PublishableTemplate) {
  if (template.stages.length === 0) {
    throw new ApiError(
      "Não é possível publicar um template sem pelo menos uma etapa.",
      422,
      "TEMPLATE_STRUCTURE_INVALID",
    );
  }

  const activities = template.stages.flatMap((stage) => stage.activities);

  if (activities.length === 0) {
    throw new ApiError(
      "Não é possível publicar um template sem pelo menos uma atividade.",
      422,
      "TEMPLATE_STRUCTURE_INVALID",
    );
  }

  for (const activity of activities) {
    for (const requirement of activity.requirements) {
      assertStoredRequirement(requirement);
    }
  }
}

export function readQuantityConfiguration(
  configuration: unknown,
): QuantityConfiguration {
  if (configuration == null) {
    return { unit: null, plannedQuantity: null };
  }

  if (typeof configuration !== "object" || Array.isArray(configuration)) {
    throw new ApiError(
      "A configuração de quantidade é inválida.",
      422,
      "VALIDATION_ERROR",
    );
  }

  const record = configuration as Record<string, unknown>;
  const unit =
    typeof record.unit === "string" && record.unit.trim().length > 0
      ? record.unit.trim()
      : null;
  const plannedQuantity =
    typeof record.plannedQuantity === "number" ? record.plannedQuantity : null;

  return { unit, plannedQuantity };
}

export function readCompletionPercentage(configuration: unknown): number {
  if (
    configuration == null ||
    typeof configuration !== "object" ||
    Array.isArray(configuration)
  ) {
    throw new ApiError(
      "Informe o percentual mínimo de conclusão.",
      422,
      "VALIDATION_ERROR",
    );
  }

  const value = (configuration as { minimumPercentage?: unknown })
    .minimumPercentage;

  if (typeof value !== "number") {
    throw new ApiError(
      "Informe o percentual mínimo de conclusão.",
      422,
      "VALIDATION_ERROR",
    );
  }

  return assertCompletionPercentage(value);
}
