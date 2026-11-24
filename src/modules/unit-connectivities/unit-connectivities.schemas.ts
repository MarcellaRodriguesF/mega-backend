import { z } from "zod";

const optionalString = (maxLength: number) =>
  z.string().trim().max(maxLength).nullable().optional();

const nameField = z
  .string()
  .trim()
  .min(1, "O nome da conectividade é obrigatório.")
  .max(150);

const technologyField = z
  .string()
  .trim()
  .min(1, "A tecnologia é obrigatória.")
  .max(100);

const providerIdField = z.string().uuid("Informe um provedor válido.");

export const createUnitConnectivitySchema = z.object({
  unitId: z.string().uuid("Informe uma unidade válida."),
  providerId: providerIdField,
  name: nameField.optional(),
  technology: technologyField,
  publicIp: optionalString(45),
  observations: z.string().trim().nullable().optional(),
});

export const updateUnitConnectivitySchema = z
  .object({
    providerId: providerIdField.optional(),
    name: nameField.optional(),
    technology: technologyField.optional(),
    publicIp: optionalString(45),
    observations: z.string().trim().nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Informe pelo menos um campo para atualização.",
  });

export type CreateUnitConnectivityInput = z.infer<
  typeof createUnitConnectivitySchema
>;

export type UpdateUnitConnectivityInput = z.infer<
  typeof updateUnitConnectivitySchema
>;
