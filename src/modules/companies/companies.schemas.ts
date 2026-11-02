import { z } from "zod";

import { CompanyRelationshipStage } from "../../shared/enums/company-relationship-stage.enum.js";
import { CompanyAddressType } from "../../shared/enums/company-address-type.enum.js";
import { RecordStatus } from "../../shared/enums/record-status.enum.js";

const optionalString = (maxLength: number) =>
  z.string().trim().max(maxLength).nullable().optional();

export const createCompanyAddressSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "O nome do endereço é obrigatório.")
      .max(150),

    type: z.nativeEnum(CompanyAddressType).default(CompanyAddressType.OTHER),

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

    isPrimary: z.boolean().default(true),

    observations: z.string().trim().nullable().optional(),
  })
  .refine(
    (data) =>
      (data.latitude == null && data.longitude == null) ||
      (data.latitude != null && data.longitude != null),
    {
      message: "Informe latitude e longitude juntas.",
      path: ["latitude"],
    },
  );

export const createCompanySchema = z.object({
  corporateName: optionalString(255),

  tradeName: z
    .string()
    .trim()
    .min(1, "O nome fantasia é obrigatório.")
    .max(255),

  cnpj: z
    .string()
    .trim()
    .regex(/^\d{14}$/, "O CNPJ deve conter 14 números.")
    .nullable()
    .optional(),

  relationshipStage: z
    .nativeEnum(CompanyRelationshipStage)
    .default(CompanyRelationshipStage.LEAD),

  observations: z.string().trim().nullable().optional(),

  address: createCompanyAddressSchema.optional(),
});

export const updateCompanySchema = createCompanySchema
  .omit({ tradeName: true, address: true })
  .partial()
  .extend({
    tradeName: z
      .string()
      .trim()
      .min(1, "O nome fantasia não pode ficar vazio.")
      .max(255)
      .optional(),

    status: z.nativeEnum(RecordStatus).optional(),

    address: createCompanyAddressSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Informe pelo menos um campo para atualização.",
  });

export type CreateCompanyAddressInput = z.infer<
  typeof createCompanyAddressSchema
>;

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;

export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
