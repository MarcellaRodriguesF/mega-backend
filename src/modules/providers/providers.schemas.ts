
import { z } from "zod";

import { RecordStatus } from "../../shared/enums/record-status.enum.js";

export const createProviderSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "O nome do provedor é obrigatório.")
    .max(255, "O nome deve ter no máximo 255 caracteres."),

  phone: z
    .string()
    .trim()
    .max(20, "O telefone deve ter no máximo 20 caracteres.")
    .nullable()
    .optional(),

  observations: z.string().trim().nullable().optional(),
});

export const updateProviderSchema = createProviderSchema
  .partial()
  .extend({
    status: z.nativeEnum(RecordStatus).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Informe pelo menos um campo para atualização.",
  });

export type CreateProviderInput = z.infer<typeof createProviderSchema>;

export type UpdateProviderInput = z.infer<typeof updateProviderSchema>;
