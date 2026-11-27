import { z } from "zod";

import { IMPLEMENTATION_WORK_STATUSES } from "../implementations/implementations.rules.js";

const uuid = (message: string) => z.string().uuid(message);
const optionalUuid = (message: string) =>
  uuid(message).nullish().transform((value) => value ?? null);

const descriptionSchema = z
  .string()
  .trim()
  .max(5000)
  .nullish()
  .transform((value) => (value == null || value.length === 0 ? null : value));

export const ACTIVITY_SCOPES = ["all", "independent", "linked"] as const;

export const createActivitySchema = z.object({
  name: z.string().trim().min(1, "Informe o nome da atividade.").max(255),
  description: descriptionSchema,
  companyId: optionalUuid("Cliente inválido."),
  unitId: optionalUuid("Unidade inválida."),
  implementationId: optionalUuid("Implantação inválida."),
  stageId: optionalUuid("Etapa inválida."),
});

export const updateActivitySchema = z.object({
  name: z.string().trim().min(1, "Informe o nome da atividade.").max(255),
  description: descriptionSchema,
});

export const listActivitiesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  scope: z.enum(ACTIVITY_SCOPES).default("all"),
  companyId: uuid("Cliente inválido.").optional(),
  unitId: uuid("Unidade inválida.").optional(),
  implementationId: uuid("Implantação inválida.").optional(),
  status: z.enum(IMPLEMENTATION_WORK_STATUSES).optional(),
});

export const assignmentSchema = z.object({
  userId: uuid("Usuário inválido."),
  role: z.enum(["EXECUTOR", "SUPERVISOR"]),
});

export const placementSchema = z.object({
  implementationId: uuid("Implantação inválida."),
  stageId: optionalUuid("Etapa inválida."),
  acknowledgeCompleted: z.boolean().default(false),
  reason: descriptionSchema,
});

export const detachSchema = z.object({
  acknowledgeCompleted: z.boolean().default(false),
  reason: descriptionSchema,
});

export type CreateActivityInput = z.infer<typeof createActivitySchema>;
export type UpdateActivityInput = z.infer<typeof updateActivitySchema>;
export type ListActivitiesQuery = z.infer<typeof listActivitiesQuerySchema>;
export type AssignmentInput = z.infer<typeof assignmentSchema>;
export type PlacementInput = z.infer<typeof placementSchema>;
export type DetachInput = z.infer<typeof detachSchema>;
