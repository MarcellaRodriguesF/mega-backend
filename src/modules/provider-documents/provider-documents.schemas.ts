import { z } from "zod";

const optionalText = (maxLength: number) =>
  z.string().trim().max(maxLength).nullable().optional();

const optionalDate = z.preprocess(
  (value) => (value === "" ? null : value),
  z.union([z.null(), z.coerce.date()]).optional(),
);

export const createProviderDocumentSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "O nome do documento é obrigatório.")
    .max(150, "O nome deve ter no máximo 150 caracteres."),

  type: z
    .string()
    .trim()
    .min(1, "O tipo do documento é obrigatório.")
    .max(50, "O tipo deve ter no máximo 50 caracteres."),

  fileName: z
    .string()
    .trim()
    .min(1, "O nome do arquivo é obrigatório.")
    .max(255, "O nome do arquivo deve ter no máximo 255 caracteres."),

  storageKey: z
    .string()
    .trim()
    .min(1, "A chave de armazenamento é obrigatória.")
    .max(500, "A chave de armazenamento deve ter no máximo 500 caracteres.")
    .optional(),

  mimeType: optionalText(100),

  sizeBytes: z
    .number()
    .int("O tamanho do arquivo deve ser um número inteiro.")
    .nonnegative("O tamanho do arquivo não pode ser negativo.")
    .nullable()
    .optional(),

  expiresAt: optionalDate,

  observations: z.string().trim().nullable().optional(),
});

export const updateProviderDocumentSchema = createProviderDocumentSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Informe pelo menos um campo para atualização.",
  });

export type CreateProviderDocumentInput = z.infer<
  typeof createProviderDocumentSchema
>;

export type UpdateProviderDocumentInput = z.infer<
  typeof updateProviderDocumentSchema
>;
