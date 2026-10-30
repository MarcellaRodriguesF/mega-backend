import { z } from "zod";
import { CompanyRelationshipStage } from "../../shared/enums/company-relationship-stage.enum.js";
import { RecordStatus } from "../../shared/enums/record-status.enum.js";

const optionalString = (maxLength: number) =>
  z.string().trim().max(maxLength).nullable().optional();

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

  relationshipStage: z
    .nativeEnum(CompanyRelationshipStage)
    .default(CompanyRelationshipStage.LEAD),

  observations: z.string().trim().nullable().optional(),
});

export const updateCompanySchema = createCompanySchema
  .omit({ tradeName: true })
  .partial()
  .extend({
    tradeName: z
      .string()
      .trim()
      .min(1, "O nome fantasia não pode ficar vazio.")
      .max(255)
      .optional(),

    status: z.nativeEnum(RecordStatus).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Informe pelo menos um campo para atualização.",
  });

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
