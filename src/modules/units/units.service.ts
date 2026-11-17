
import { ApiError } from "../../shared/http/api-error.js";
import { UnitsRepository } from "./units.repository.js";
import type {
  CreateUnitInput,
  UpdateUnitInput,
} from "./units.schemas.js";

export class UnitsService {
  private readonly unitsRepository = new UnitsRepository();

  async create(data: CreateUnitInput) {
    const company = await this.unitsRepository.findCompanyById(
      data.companyId,
    );

    if (!company) {
      throw new ApiError(
        "Empresa não encontrada.",
        404,
        "UNIT_COMPANY_NOT_FOUND",
      );
    }

    return this.unitsRepository.create(data);
  }

  async findAll() {
    return this.unitsRepository.findAll();
  }

  async findById(id: string) {
    const unit = await this.unitsRepository.findById(id);

    if (!unit) {
      throw new ApiError(
        "Unidade não encontrada.",
        404,
        "UNIT_NOT_FOUND",
      );
    }

    return unit;
  }

  async update(id: string, data: UpdateUnitInput) {
    const unit = await this.unitsRepository.findById(id);

    if (!unit) {
      throw new ApiError(
        "Unidade não encontrada.",
        404,
        "UNIT_NOT_FOUND",
      );
    }

    if (data.companyId && data.companyId !== unit.companyId) {
      const company = await this.unitsRepository.findCompanyById(
        data.companyId,
      );

      if (!company) {
        throw new ApiError(
          "Empresa não encontrada.",
          404,
          "UNIT_COMPANY_NOT_FOUND",
        );
      }
    }

    return this.unitsRepository.update(id, data);
  }

  async delete(id: string) {
    const unit = await this.unitsRepository.findById(id);

    if (!unit) {
      throw new ApiError(
        "Unidade não encontrada.",
        404,
        "UNIT_NOT_FOUND",
      );
    }

    if (unit.connectivities.length > 0) {
      throw new ApiError(
        "Não é possível excluir esta unidade porque existem conectividades associadas.",
        409,
        "UNIT_HAS_ASSOCIATED_CONNECTIVITIES",
      );
    }

    return this.unitsRepository.delete(id);
  }
}
