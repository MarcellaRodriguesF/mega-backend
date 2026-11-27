import { z } from "zod";

import {
  assertFieldOptions,
  FORM_FIELD_TYPES,
  FORM_TEMPLATE_STATUSES,
  type FormFieldOption,
} from "./form-templates.rules.js";

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

const optionSchema = z.object({
  value: z
    .string()
    .trim()
    .min(1, "O valor da opção é obrigatório.")
    .max(100, "O valor da opção deve ter no máximo 100 caracteres."),
  label: z
    .string()
    .trim()
    .min(1, "O rótulo da opção é obrigatório.")
    .max(150, "O rótulo da opção deve ter no máximo 150 caracteres."),
});

export const createFormTemplateSchema = z.object({
  name: nameSchema,
  description: descriptionSchema,
  status: z.enum(FORM_TEMPLATE_STATUSES).default("ACTIVE"),
});

export const updateFormTemplateSchema = z.object({
  name: nameSchema,
  description: descriptionSchema,
});

export const updateFormTemplateStatusSchema = z.object({
  status: z.enum(FORM_TEMPLATE_STATUSES),
});

export const listFormTemplatesQuerySchema = z.object({
  status: z.enum(FORM_TEMPLATE_STATUSES).optional(),
});

export const formFieldSchema = z
  .object({
    key: z
      .string()
      .trim()
      .min(1, "A chave do campo é obrigatória.")
      .max(100, "A chave deve ter no máximo 100 caracteres.")
      .regex(
        /^[A-Za-z][A-Za-z0-9_]*$/,
        "A chave deve começar com uma letra e conter apenas letras, números e _.",
      ),
    label: z
      .string()
      .trim()
      .min(1, "O rótulo do campo é obrigatório.")
      .max(255, "O rótulo deve ter no máximo 255 caracteres."),
    description: descriptionSchema,
    type: z.enum(FORM_FIELD_TYPES),
    placeholder: z
      .string()
      .trim()
      .max(255, "O placeholder deve ter no máximo 255 caracteres.")
      .nullish()
      .transform((value) => {
        if (value == null || value.length === 0) return null;
        return value;
      }),
    isRequired: z.boolean(),
    options: z.array(optionSchema).nullable().default(null),
  })
  .superRefine((data, context) => {
    try {
      assertFieldOptions(data.type, data.options);
    } catch (error) {
      context.addIssue({
        code: "custom",
        message:
          error instanceof Error ? error.message : "Opções do campo inválidas.",
        path: ["options"],
      });
    }
  })
  .transform((data) => ({
    ...data,
    options: assertFieldOptions(data.type, data.options),
  }));

export const reorderFormFieldsSchema = z.object({
  ids: z.array(z.string().uuid("Identificador inválido.")).min(1),
});

export type CreateFormTemplateInput = z.infer<typeof createFormTemplateSchema>;
export type UpdateFormTemplateInput = z.infer<typeof updateFormTemplateSchema>;
export type UpdateFormTemplateStatusInput = z.infer<
  typeof updateFormTemplateStatusSchema
>;
export type ListFormTemplatesQuery = z.infer<typeof listFormTemplatesQuerySchema>;
export type FormFieldInput = z.infer<typeof formFieldSchema>;
export type FormFieldOptionInput = FormFieldOption;
