import { z } from "zod";

export const createContactSchema = z.object({
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

  whatsapp: z
    .string()
    .trim()
    .max(20, "O WhatsApp deve ter no máximo 20 caracteres.")
    .nullable()
    .optional(),

  isPrimary: z.boolean().default(false),
});

export const updateContactSchema = createContactSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Informe pelo menos um campo para atualização.",
  });

export type CreateContactInput = z.infer<typeof createContactSchema>;

export type UpdateContactInput = z.infer<typeof updateContactSchema>;
