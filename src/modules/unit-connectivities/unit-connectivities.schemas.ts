
import { z } from "zod";

import { RecordStatus } from "../../shared/enums/record-status.enum.js";

const optionalString = (maxLength: number) =>
  z.string().trim().max(maxLength).nullable().optional();

const optionalPositiveNumber = () =>
  z.number().min(0, "O valor não pode ser negativo.").nullable().optional();

const optionalDate = () =>
  z.coerce.date().nullable().optional();

const connectivityFields = {
  providerId: z
    .string()
    .uuid("Informe um provedor válido.")
    .nullable()
    .optional(),

  name: z
    .string()
    .trim()
    .min(1, "O nome da conectividade é obrigatório.")
    .max(150),

  technology: z
    .string()
    .trim()
    .min(1, "A tecnologia é obrigatória.")
    .max(100),

  networkName: optionalString(150),

  downloadCapacityMbps: optionalPositiveNumber(),

  uploadCapacityMbps: optionalPositiveNumber(),

  responseTimeMs: optionalPositiveNumber(),

  throughputMbps: optionalPositiveNumber(),

  rxSignalDbm: z.number().nullable().optional(),

  publicIp: optionalString(45),

  wanIp: optionalString(45),

  gatewayIp: optionalString(45),

  localIp: optionalString(45),

  slaPercentage: z
    .number()
    .min(0, "O SLA não pode ser menor que 0.")
    .max(100, "O SLA não pode ser maior que 100.")
    .nullable()
    .optional(),

  mttrHours: optionalPositiveNumber(),

  monitoringEnabled: z.boolean().default(false),

  serviceStartDate: optionalDate(),

  serviceEndDate: optionalDate(),

  observations: z.string().trim().nullable().optional(),
};

const validateServiceDates = (
  data: {
    serviceStartDate?: Date | null;
    serviceEndDate?: Date | null;
  },
) =>
  !data.serviceStartDate ||
  !data.serviceEndDate ||
  data.serviceEndDate >= data.serviceStartDate;

export const createUnitConnectivitySchema = z
  .object({
    unitId: z.string().uuid("Informe uma unidade válida."),
    ...connectivityFields,
  })
  .refine(validateServiceDates, {
    message: "A data de término deve ser posterior à data de início.",
    path: ["serviceEndDate"],
  });

export const updateUnitConnectivitySchema = z
  .object({
    ...connectivityFields,
    status: z.nativeEnum(RecordStatus).optional(),
  })
  .refine(validateServiceDates, {
    message: "A data de término deve ser posterior à data de início.",
    path: ["serviceEndDate"],
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
