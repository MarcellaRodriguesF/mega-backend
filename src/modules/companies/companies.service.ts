import { ApiError } from "../../shared/http/api-error.js";
import { CompaniesRepository } from "./companies.repository.js";
import type {
  CreateCompanyInput,
  UpdateCompanyInput,
} from "./companies.schemas.js";

export class CompaniesService {
  private readonly companiesRepository = new CompaniesRepository();

  async create(data: CreateCompanyInput) {
    if (data.cnpj) {
      const existingCompany = await this.companiesRepository.findByCnpj(
        data.cnpj,
      );

      if (existingCompany) {
        throw new ApiError(
          "Já existe uma empresa cadastrada com este CNPJ.",
          409,
          "COMPANY_CNPJ_ALREADY_EXISTS",
        );
      }
    }

    return this.companiesRepository.create(data);
  }

  async findAll() {
    return this.companiesRepository.findAll();
  }

  async findById(id: string) {
    const company = await this.companiesRepository.findById(id);

    if (!company) {
      throw new ApiError("Empresa não encontrada.", 404, "COMPANY_NOT_FOUND");
    }

    return company;
  }

  async update(id: string, data: UpdateCompanyInput) {
    const company = await this.companiesRepository.findById(id);

    if (!company) {
      throw new ApiError("Empresa não encontrada.", 404, "COMPANY_NOT_FOUND");
    }

    if (data.cnpj && data.cnpj !== company.cnpj) {
      const existingCompany = await this.companiesRepository.findByCnpj(
        data.cnpj,
      );

      if (existingCompany) {
        throw new ApiError(
          "Já existe uma empresa cadastrada com este CNPJ.",
          409,
          "COMPANY_CNPJ_ALREADY_EXISTS",
        );
      }
    }

    return this.companiesRepository.update(id, data);
  }
}
