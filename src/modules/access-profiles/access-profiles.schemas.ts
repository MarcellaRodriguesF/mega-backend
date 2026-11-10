import { z } from "zod";

export const createAccessProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "O nome deve ter pelo menos 2 caracteres.")
    .max(255),

  description: z.string().trim().max(255).nullable().optional(),

  permissionCodes: z.array(z.string()).default([]),
});

export const updateAccessProfileSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Informe um nome válido.")
      .max(255)
      .optional(),
    description: z.string().trim().max(255).nullable().optional(),
    status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
    permissionCodes: z.array(z.string().trim().min(1)).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Informe ao menos um campo para atualização.",
  });
