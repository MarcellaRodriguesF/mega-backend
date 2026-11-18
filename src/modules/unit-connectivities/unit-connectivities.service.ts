
import { ApiError } from "../../shared/http/api-error.js";
import { UnitConnectivitiesRepository } from "./unit-connectivities.repository.js";
import type {
  CreateUnitConnectivityInput,
  UpdateUnitConnectivityInput,
} from "./unit-connectivities.schemas.js";

export class UnitConnectivitiesService {
  private readonly repository = new UnitConnectivitiesRepository();

  async create(data: CreateUnitConnectivityInput) {
    const unit = await this.repository.findUnitById(data.unitId);

    if (!unit) {
      throw new ApiError(
        "Unidade não encontrada.",
        404,
        "CONNECTIVITY_UNIT_NOT_FOUND",
      );
    }

    if (data.providerId) {
      const provider = await this.repository.findProviderById(
        data.providerId,
      );

      if (!provider) {
        throw new ApiError(
          "Provedor não encontrado.",
          404,
          "CONNECTIVITY_PROVIDER_NOT_FOUND",
        );
      }
    }

    return this.repository.create(data);
  }

  async findAll() {
    return this.repository.findAll();
  }

  async findById(id: string) {
    const connectivity = await this.repository.findById(id);

    if (!connectivity) {
      throw new ApiError(
        "Conectividade não encontrada.",
        404,
        "CONNECTIVITY_NOT_FOUND",
      );
    }

    return connectivity;
  }

  async findByUnitId(unitId: string) {
    const unit = await this.repository.findUnitById(unitId);

    if (!unit) {
      throw new ApiError(
        "Unidade não encontrada.",
        404,
        "CONNECTIVITY_UNIT_NOT_FOUND",
      );
    }

    return this.repository.findByUnitId(unitId);
  }

  async update(id: string, data: UpdateUnitConnectivityInput) {
    const connectivity = await this.repository.findById(id);

    if (!connectivity) {
      throw new ApiError(
        "Conectividade não encontrada.",
        404,
        "CONNECTIVITY_NOT_FOUND",
      );
    }

    if (data.providerId) {
      const provider = await this.repository.findProviderById(
        data.providerId,
      );

      if (!provider) {
        throw new ApiError(
          "Provedor não encontrado.",
          404,
          "CONNECTIVITY_PROVIDER_NOT_FOUND",
        );
      }
    }

    return this.repository.update(id, data);
  }

  async delete(id: string) {
    const connectivity = await this.repository.findById(id);

    if (!connectivity) {
      throw new ApiError(
        "Conectividade não encontrada.",
        404,
        "CONNECTIVITY_NOT_FOUND",
      );
    }

    return this.repository.delete(id);
  }
}
