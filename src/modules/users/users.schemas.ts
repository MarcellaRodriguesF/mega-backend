import { z } from "zod";

export const createUserSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Informe um e-mail válido.")
    .max(255),

  password: z
    .string()
    .min(8, "A senha deve ter pelo menos 8 caracteres.")
    .max(100),

  accessProfileId: z.uuid("Perfil de acesso inválido."),
});

export const updateUserSchema = z
  .object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Informe um e-mail válido.")
      .max(255)
      .optional(),

    password: z
      .string()
      .min(8, "A senha deve ter pelo menos 8 caracteres.")
      .max(100)
      .optional(),

    accessProfileId: z.uuid("Perfil de acesso inválido.").optional(),

    status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Informe pelo menos um campo para atualização.",
  });

export type CreateUserInput = z.infer<typeof createUserSchema>;

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
