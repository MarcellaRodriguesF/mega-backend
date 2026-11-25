import { z } from "zod";

import { IMPLEMENTATION_STATUSES } from "./implementations.rules.js";

const uuid = (message: string) => z.string().uuid(message);

export const createImplementationSchema = z.object({
  templateId: uuid("Selecione um template publicado."),
  unitId: uuid("Selecione uma unidade."),
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

export type CreateImplementationInput = z.infer<typeof createImplementationSchema>;
export type ListImplementationsQuery = z.infer<typeof listImplementationsQuerySchema>;
export type CatalogUnitsQuery = z.infer<typeof catalogUnitsQuerySchema>;
