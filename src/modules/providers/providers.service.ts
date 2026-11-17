import { ApiError } from "../../shared/http/api-error.js";
import { ProvidersRepository } from "./providers.repository.js";
import type {
  CreateProviderInput,
  UpdateProviderInput,
} from "./providers.schemas.js";

export class ProvidersService {
  private readonly providersRepository = new ProvidersRepository();

  async create(data: CreateProviderInput) {
    return this.providersRepository.create(data);
  }

  async findAll() {
    return this.providersRepository.findAll();
  }

  async findById(id: string) {
    const provider = await this.providersRepository.findById(id);

    if (!provider) {
      throw new ApiError("Provedor não encontrado.", 404, "PROVIDER_NOT_FOUND");
    }

    return provider;
  }

  async update(id: string, data: UpdateProviderInput) {
    const provider = await this.providersRepository.findById(id);

    if (!provider) {
      throw new ApiError("Provedor não encontrado.", 404, "PROVIDER_NOT_FOUND");
    }

    return this.providersRepository.update(id, data);
  }

  async delete(id: string) {
    const provider = await this.providersRepository.findById(id);

    if (!provider) {
      throw new ApiError("Provedor não encontrado.", 404, "PROVIDER_NOT_FOUND");
    }

    if (provider.connectivities.length > 0) {
      throw new ApiError(
        "Não é possível excluir este provedor porque existem conectividades de unidades associadas.",
        409,
        "PROVIDER_HAS_ASSOCIATED_CONNECTIVITIES",
      );
    }

    return this.providersRepository.delete(id);
  }
}
