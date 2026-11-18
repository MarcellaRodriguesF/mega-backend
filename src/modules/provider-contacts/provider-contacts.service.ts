import { ApiError } from "../../shared/http/api-error.js";
import { ProvidersRepository } from "../providers/providers.repository.js";
import { ProviderContactsRepository } from "./provider-contacts.repository.js";

import type {
  CreateProviderContactInput,
  UpdateProviderContactInput,
} from "./provider-contacts.schemas.js";

export class ProviderContactsService {
  private readonly providerContactsRepository = new ProviderContactsRepository();
  private readonly providersRepository = new ProvidersRepository();

  async findAllByProvider(providerId: string) {
    await this.ensureProviderExists(providerId);

    return this.providerContactsRepository.findAllByProvider(providerId);
  }

  async findById(id: string, providerId: string) {
    await this.ensureProviderExists(providerId);

    const contact = await this.providerContactsRepository.findById(
      id,
      providerId,
    );

    if (!contact) {
      throw new ApiError(
        "Contato não encontrado.",
        404,
        "PROVIDER_CONTACT_NOT_FOUND",
      );
    }

    return contact;
  }

  async create(providerId: string, data: CreateProviderContactInput) {
    await this.ensureProviderExists(providerId);

    return this.providerContactsRepository.create({
      ...data,
      providerId,
    });
  }

  async update(
    id: string,
    providerId: string,
    data: UpdateProviderContactInput,
  ) {
    await this.findById(id, providerId);

    return this.providerContactsRepository.update(id, providerId, data);
  }

  async delete(id: string, providerId: string) {
    await this.findById(id, providerId);

    return this.providerContactsRepository.delete(id);
  }

  private async ensureProviderExists(providerId: string) {
    const provider = await this.providersRepository.findById(providerId);

    if (!provider) {
      throw new ApiError("Provedor não encontrado.", 404, "PROVIDER_NOT_FOUND");
    }

    return provider;
  }
}
