import { z } from "zod";

import {
  ACTIVITY_REQUIREMENT_TYPES,
  assertCompletionPercentage,
  assertEvidenceRequirement,
  assertQuantityConfiguration,
  TEMPLATE_STATUSES,
} from "./templates.rules.js";

const nameSchema = z
  .string()
  .trim()
  .min(1, "O nome é obrigatório.")
  .max(255, "O nome deve ter no máximo 255 caracteres.");

const descriptionSchema = z
  .string()
  .trim()
  .max(5000, "A descrição deve ter no máximo 5000 caracteres.")
  .nullish()
  .transform((value) => {
    if (value == null || value.length === 0) return null;
    return value;
  });

export const createTemplateSchema = z.object({
  name: nameSchema,
  description: descriptionSchema,
});

export const updateTemplateSchema = createTemplateSchema;

export const updateTemplateStatusSchema = z.object({
  status: z.enum(TEMPLATE_STATUSES),
});

export const listTemplatesQuerySchema = z.object({
  status: z.enum(TEMPLATE_STATUSES).optional(),
});

export const createStageSchema = z.object({
  name: nameSchema,
  description: descriptionSchema,
});

export const updateStageSchema = createStageSchema;

export const createActivitySchema = z.object({
  name: nameSchema,
  description: descriptionSchema,
});

export const updateActivitySchema = createActivitySchema;

export const reorderSchema = z.object({
  ids: z.array(z.string().uuid("Identificador inválido.")).min(1),
});

const quantityConfigurationSchema = z.object({
  unit: z
    .string()
    .trim()
    .max(50, "A unidade deve ter no máximo 50 caracteres.")
    .nullish()
    .transform((value) => {
      if (value == null || value.length === 0) return null;
      return value;
    }),
  plannedQuantity: z
    .number()
    .positive("A quantidade planejada deve ser maior que zero.")
    .nullable()
    .optional()
    .transform((value) => value ?? null),
});

export const requirementSchema = z
  .object({
    type: z.enum(ACTIVITY_REQUIREMENT_TYPES),
    isRequired: z.boolean(),
    evidenceTypes: z
      .array(
        z
          .string()
          .trim()
          .min(1, "O tipo de evidência é obrigatório.")
          .max(50, "O tipo de evidência deve ter no máximo 50 caracteres."),
      )
      .optional(),
    formTemplateId: z
      .string()
      .uuid("Selecione um formulário válido.")
      .nullable()
      .optional(),
    configuration: z.unknown().optional(),
  })
  .superRefine((data, context) => {
    if (data.type === "EVIDENCE") {
      try {
        assertEvidenceRequirement(data.isRequired, data.evidenceTypes ?? []);
      } catch (error) {
        context.addIssue({
          code: "custom",
          message:
            error instanceof Error
              ? error.message
              : "Configuração de evidência inválida.",
          path: ["evidenceTypes"],
        });
      }
    }

    if (data.type === "FORM" && !data.formTemplateId) {
      context.addIssue({
        code: "custom",
        message: "Selecione um formulário ativo.",
        path: ["formTemplateId"],
      });
    }

    if (data.type === "QUANTITY") {
      const parsed = quantityConfigurationSchema.safeParse(
        data.configuration ?? {},
      );

      if (!parsed.success) {
        context.addIssue({
          code: "custom",
          message: "A configuração de quantidade é inválida.",
          path: ["configuration"],
        });
        return;
      }

      try {
        assertQuantityConfiguration(parsed.data, data.isRequired);
      } catch (error) {
        context.addIssue({
          code: "custom",
          message:
            error instanceof Error
              ? error.message
              : "Configuração de quantidade inválida.",
          path: ["configuration"],
        });
      }
    }

    if (data.type === "COMPLETION_PERCENTAGE") {
      const configuration = data.configuration as
        | { minimumPercentage?: unknown }
        | undefined;
      const value = configuration?.minimumPercentage;

      if (typeof value !== "number") {
        context.addIssue({
          code: "custom",
          message: "Informe o percentual mínimo de conclusão.",
          path: ["configuration", "minimumPercentage"],
        });
        return;
      }

      try {
        assertCompletionPercentage(value);
      } catch (error) {
        context.addIssue({
          code: "custom",
          message:
            error instanceof Error
              ? error.message
              : "Percentual mínimo inválido.",
          path: ["configuration", "minimumPercentage"],
        });
      }
    }
  })
  .transform((data) => {
    if (data.type === "EVIDENCE") {
      return {
        type: data.type,
        isRequired: data.isRequired,
        evidenceTypes: assertEvidenceRequirement(
          data.isRequired,
          data.evidenceTypes ?? [],
        ),
        formTemplateId: null,
        configuration: null,
      };
    }

    if (data.type === "FORM") {
      return {
        type: data.type,
        isRequired: data.isRequired,
        evidenceTypes: [] as string[],
        formTemplateId: data.formTemplateId ?? null,
        configuration: null,
      };
    }

    if (data.type === "QUANTITY") {
      const configuration = quantityConfigurationSchema.parse(
        data.configuration ?? {},
      );

      return {
        type: data.type,
        isRequired: data.isRequired,
        evidenceTypes: [] as string[],
        formTemplateId: null,
        configuration: assertQuantityConfiguration(
          configuration,
          data.isRequired,
        ),
      };
    }

    if (data.type === "COMPLETION_PERCENTAGE") {
      const value = (
        data.configuration as { minimumPercentage: number }
      ).minimumPercentage;

      return {
        type: data.type,
        isRequired: data.isRequired,
        evidenceTypes: [] as string[],
        formTemplateId: null,
        configuration: {
          minimumPercentage: assertCompletionPercentage(value),
        },
      };
    }

    return {
      type: data.type,
      isRequired: data.isRequired,
      evidenceTypes: [] as string[],
      formTemplateId: null,
      configuration: null,
    };
  });

export const requirementTypeSchema = z.enum(ACTIVITY_REQUIREMENT_TYPES);

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;
export type UpdateTemplateStatusInput = z.infer<
  typeof updateTemplateStatusSchema
>;
export type ListTemplatesQuery = z.infer<typeof listTemplatesQuerySchema>;
export type CreateStageInput = z.infer<typeof createStageSchema>;
export type UpdateStageInput = z.infer<typeof updateStageSchema>;
export type CreateActivityInput = z.infer<typeof createActivitySchema>;
export type UpdateActivityInput = z.infer<typeof updateActivitySchema>;
export type ReorderInput = z.infer<typeof reorderSchema>;
export type RequirementInput = z.infer<typeof requirementSchema>;
