import { randomUUID } from "node:crypto";

import { ApiError } from "../../shared/http/api-error.js";
import { ProvidersRepository } from "../providers/providers.repository.js";
import { ProviderDocumentsRepository } from "./provider-documents.repository.js";

import type {
  CreateProviderDocumentInput,
  UpdateProviderDocumentInput,
} from "./provider-documents.schemas.js";

export class ProviderDocumentsService {
  private readonly providerDocumentsRepository =
    new ProviderDocumentsRepository();
  private readonly providersRepository = new ProvidersRepository();

  async findAllByProvider(providerId: string) {
    await this.ensureProviderExists(providerId);

    return this.providerDocumentsRepository.findAllByProvider(providerId);
  }

  async findById(id: string, providerId: string) {
    await this.ensureProviderExists(providerId);

    const document = await this.providerDocumentsRepository.findById(
      id,
      providerId,
    );

    if (!document) {
      throw new ApiError(
        "Documento não encontrado.",
        404,
        "PROVIDER_DOCUMENT_NOT_FOUND",
      );
    }

    return document;
  }

  async create(providerId: string, data: CreateProviderDocumentInput) {
    await this.ensureProviderExists(providerId);

    const storageKey =
      data.storageKey?.trim() ||
      `providers/${providerId}/documents/${randomUUID()}/${data.fileName}`;

    return this.providerDocumentsRepository.create({
      ...data,
      providerId,
      storageKey,
    });
  }

  async update(
    id: string,
    providerId: string,
    data: UpdateProviderDocumentInput,
  ) {
    await this.findById(id, providerId);

    return this.providerDocumentsRepository.update(id, data);
  }

  async delete(id: string, providerId: string) {
    await this.findById(id, providerId);

    return this.providerDocumentsRepository.delete(id);
  }

  private async ensureProviderExists(providerId: string) {
    const provider = await this.providersRepository.findById(providerId);

    if (!provider) {
      throw new ApiError("Provedor não encontrado.", 404, "PROVIDER_NOT_FOUND");
    }

    return provider;
  }
}
