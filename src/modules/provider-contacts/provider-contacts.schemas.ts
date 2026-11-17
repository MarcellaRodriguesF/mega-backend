
import { z } from "zod";

export const createProviderContactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "O nome do contato é obrigatório.")
    .max(150, "O nome deve ter no máximo 150 caracteres."),

  role: z
    .string()
    .trim()
    .max(100, "O cargo deve ter no máximo 100 caracteres.")
    .nullable()
    .optional(),

  email: z
    .string()
    .trim()
    .email("Informe um e-mail válido.")
    .max(255, "O e-mail deve ter no máximo 255 caracteres.")
    .nullable()
    .optional(),

  phone: z
    .string()
    .trim()
    .max(20, "O telefone deve ter no máximo 20 caracteres.")
    .nullable()
    .optional(),

  isPrimary: z.boolean().default(false),
});

export const updateProviderContactSchema = createProviderContactSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Informe pelo menos um campo para atualização.",
  });

export type CreateProviderContactInput = z.infer<
  typeof createProviderContactSchema
>;

export type UpdateProviderContactInput = z.infer<
  typeof updateProviderContactSchema
>;
