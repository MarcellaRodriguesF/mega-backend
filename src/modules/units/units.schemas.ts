import { z } from "zod";

import { RecordStatus } from "../../shared/enums/record-status.enum.js";

const optionalString = (maxLength: number) =>
  z.string().trim().max(maxLength).nullable().optional();

export const createUnitAddressSchema = z
  .object({
    zipCode: z
      .string()
      .trim()
      .regex(/^\d{8}$/, "O CEP deve conter 8 números.")
      .nullable()
      .optional(),

    street: optionalString(255),
    number: optionalString(20),
    complement: optionalString(150),
    neighborhood: optionalString(100),
    city: optionalString(100),

    state: z
      .string()
      .trim()
      .length(2, "Informe a sigla do estado.")
      .nullable()
      .optional(),

    areaType: z.string().trim().max(20).optional(),

    latitude: z
      .number()
      .min(-90, "Latitude inválida.")
      .max(90, "Latitude inválida.")
      .nullable()
      .optional(),

    longitude: z
      .number()
      .min(-180, "Longitude inválida.")
      .max(180, "Longitude inválida.")
      .nullable()
      .optional(),

    observations: z.string().trim().nullable().optional(),
  })
  .refine(
    (data) =>
      (data.latitude == null && data.longitude == null) ||
      (data.latitude != null && data.longitude != null),
    {
      message: "Informe latitude e longitude juntas.",
      path: ["latitude"],
    }
  );

export const listCompanyUnitsQuerySchema = z.object({
  search: z.string().trim().optional(),
  status: z.enum([RecordStatus.ACTIVE, RecordStatus.INACTIVE]).optional(),
});

export const createUnitSchema = z.object({
  companyId: z.string().uuid("Informe uma empresa válida."),

  name: z.string().trim().min(1, "O nome da unidade é obrigatório.").max(255),

  type: z.string().trim().min(1, "O tipo da unidade é obrigatório.").max(100),

  observations: z.string().trim().nullable().optional(),

  address: createUnitAddressSchema.optional(),
});

export const updateUnitSchema = createUnitSchema
  .omit({ name: true, address: true })
  .partial()
  .extend({
    name: z
      .string()
      .trim()
      .min(1, "O nome da unidade não pode ficar vazio.")
      .max(255)
      .optional(),

    status: z.nativeEnum(RecordStatus).optional(),

    address: createUnitAddressSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Informe pelo menos um campo para atualização.",
  });

export type ListCompanyUnitsQuery = z.infer<typeof listCompanyUnitsQuerySchema>;

export type CreateUnitAddressInput = z.infer<typeof createUnitAddressSchema>;

export type CreateUnitInput = z.infer<typeof createUnitSchema>;

export type UpdateUnitInput = z.infer<typeof updateUnitSchema>;
