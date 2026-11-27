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

const documentName = z
  .string()
  .trim()
  .min(1, "O nome do documento é obrigatório.")
  .max(150, "O nome deve ter no máximo 150 caracteres.");

const optionalDocumentType = z.preprocess((value) => {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  return value;
}, z.string().trim().max(50, "O tipo deve ter no máximo 50 caracteres.").nullable().optional());

const optionalUnitId = z.preprocess((value) => {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  return value;
}, z.string().uuid("Unidade inválida.").nullable().optional());

export const createProviderDocumentFieldsSchema = z.object({
  name: documentName,
  type: optionalDocumentType,
  observations: nullableText,
});

export const updateProviderDocumentFieldsSchema = z.object({
  name: documentName.optional(),
  type: optionalDocumentType,
  observations: optionalNullableText,
});

export const createCompanyDocumentFieldsSchema = z.object({
  name: documentName,
  type: optionalDocumentType,
  unitId: optionalUnitId,
  observations: nullableText,
});

export const updateCompanyDocumentFieldsSchema = z.object({
  name: documentName.optional(),
  type: optionalDocumentType,
  unitId: optionalUnitId,
  observations: optionalNullableText,
});

export type CreateProviderDocumentFields = z.infer<
  typeof createProviderDocumentFieldsSchema
>;

export type UpdateProviderDocumentFields = z.infer<
  typeof updateProviderDocumentFieldsSchema
>;

export type CreateCompanyDocumentFields = z.infer<
  typeof createCompanyDocumentFieldsSchema
>;

export type UpdateCompanyDocumentFields = z.infer<
  typeof updateCompanyDocumentFieldsSchema
>;
