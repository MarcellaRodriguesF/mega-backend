import { z } from "zod";

import { IMPLEMENTATION_STATUSES } from "./implementations.rules.js";

const uuid = (message: string) => z.string().uuid(message);
const optionalUuid = (message: string) =>
  uuid(message).nullish().transform((value) => value ?? null);

const descriptionSchema = z
  .string()
  .trim()
  .max(5000)
  .nullish()
  .transform((value) => {
    if (value == null || value.length === 0) return null;
    return value;
  });

export const createImplementationSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome da implantação.").max(255),
  description: descriptionSchema,
  templateId: optionalUuid("Selecione um template publicado."),
  companyId: optionalUuid("Cliente inválido."),
  unitId: optionalUuid("Unidade inválida."),
});

export const updateImplementationSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome da implantação.").max(255),
  description: descriptionSchema,
});

export const listImplementationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  unitId: uuid("Unidade inválida.").optional(),
  companyId: uuid("Empresa inválida.").optional(),
  status: z.enum(IMPLEMENTATION_STATUSES).optional(),
});

export const catalogUnitsQuerySchema = z.object({
  companyId: uuid("Empresa inválida.").optional(),
});

export const stageSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome da etapa.").max(255),
  description: descriptionSchema,
});

export const reorderStagesSchema = z.object({
  ids: z.array(uuid("Identificador inválido.")).min(1),
});

export type CreateImplementationInput = z.infer<typeof createImplementationSchema>;
export type UpdateImplementationInput = z.infer<typeof updateImplementationSchema>;
export type ListImplementationsQuery = z.infer<typeof listImplementationsQuerySchema>;
export type CatalogUnitsQuery = z.infer<typeof catalogUnitsQuerySchema>;
export type StageInput = z.infer<typeof stageSchema>;
export type ReorderStagesInput = z.infer<typeof reorderStagesSchema>;
