import { z } from "zod";

const nullableText = z.preprocess((value) => {
  if (value === undefined || value === null || value === "") return null;
  return value;
}, z.string().trim().nullable());

const optionalNullableText = z.preprocess((value) => {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  return value;
}, z.string().trim().nullable().optional());

export const createProviderDocumentFieldsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "O nome do documento é obrigatório.")
    .max(150, "O nome deve ter no máximo 150 caracteres."),

  observations: nullableText,
});

export const updateProviderDocumentFieldsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "O nome do documento é obrigatório.")
    .max(150, "O nome deve ter no máximo 150 caracteres.")
    .optional(),

  observations: optionalNullableText,
});

export type CreateProviderDocumentFields = z.infer<
  typeof createProviderDocumentFieldsSchema
>;

export type UpdateProviderDocumentFields = z.infer<
  typeof updateProviderDocumentFieldsSchema
>;
