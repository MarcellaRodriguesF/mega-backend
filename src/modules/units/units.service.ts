
import { ApiError } from "../../shared/http/api-error.js";
import { UnitsRepository } from "./units.repository.js";
import type {
  CreateUnitInput,
  ListCompanyUnitsQuery,
  UpdateUnitInput,
} from "./units.schemas.js";
import type { CompanyUnitListItem } from "./units.types.js";

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

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

  async findByCompanyId(companyId: string, query: ListCompanyUnitsQuery) {
    const company = await this.unitsRepository.findCompanyById(companyId);

    if (!company) {
      throw new ApiError(
        "Empresa não encontrada.",
        404,
        "COMPANY_NOT_FOUND",
      );
    }

    const units = await this.unitsRepository.findByCompanyId(
      companyId,
      query.status,
    );

    const items: CompanyUnitListItem[] = units.map((unit) => {
      const connectivity = unit.connectivities[0];

      return {
        id: unit.id,
        name: unit.name,
        status: unit.status,
        publicIp: connectivity?.publicIp ?? null,
        provider: connectivity?.provider
          ? {
              id: connectivity.provider.id,
              name: connectivity.provider.name,
              phone: connectivity.provider.phone,
            }
          : null,
      };
    });

    const search = normalizeSearch(query.search ?? "");

    if (!search) {
      return items;
    }

    return items.filter((unit) =>
      [unit.name, unit.publicIp ?? "", unit.provider?.name ?? ""].some(
        (field) => normalizeSearch(field).includes(search),
      ),
    );
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
