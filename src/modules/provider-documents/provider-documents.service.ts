import { ApiError } from "../../shared/http/api-error.js";
import { buildContentDisposition } from "../../shared/storage/content-disposition.js";
import { allowsInlinePreview } from "../../shared/storage/file-signature.js";
import { fileStorage } from "../../shared/storage/file-storage.service.js";
import type { IncomingStoredFile } from "../../shared/storage/storage.types.js";
import { ProvidersRepository } from "../providers/providers.repository.js";
import { ProviderDocumentsRepository } from "./provider-documents.repository.js";

import type {
  CreateProviderDocumentFields,
  UpdateProviderDocumentFields,
} from "./provider-documents.schemas.js";

const DOCUMENT_CONTEXT = "documents" as const;

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

  async create(
    providerId: string,
    fields: CreateProviderDocumentFields,
    file: IncomingStoredFile,
  ) {
    await this.ensureProviderExists(providerId);

    const stored = await fileStorage.save(DOCUMENT_CONTEXT, file);

    try {
      return await this.providerDocumentsRepository.create({
        providerId,
        name: fields.name,
        observations: fields.observations,
        fileName: stored.fileName,
        storageKey: stored.storageKey,
        mimeType: stored.mimeType,
        sizeBytes: stored.sizeBytes,
      });
    } catch (error) {
      await fileStorage.remove(DOCUMENT_CONTEXT, stored.storageKey).catch(() => {
        console.error("Falha ao remover arquivo órfão após erro ao salvar metadados.");
      });

      throw error;
    }
  }

  async update(
    id: string,
    providerId: string,
    fields: UpdateProviderDocumentFields,
    file?: IncomingStoredFile,
  ) {
    const current = await this.findById(id, providerId);
    const stored = file
      ? await fileStorage.save(DOCUMENT_CONTEXT, file)
      : null;

    try {
      const updated = await this.providerDocumentsRepository.update(id, {
        ...(fields.name !== undefined ? { name: fields.name } : {}),
        ...(fields.observations !== undefined
          ? { observations: fields.observations }
          : {}),
        ...(stored
          ? {
              fileName: stored.fileName,
              storageKey: stored.storageKey,
              mimeType: stored.mimeType,
              sizeBytes: stored.sizeBytes,
            }
          : {}),
      });

      if (stored && stored.storageKey !== current.storageKey) {
        await fileStorage
          .remove(DOCUMENT_CONTEXT, current.storageKey)
          .catch(() => {
            console.error("Falha ao remover o arquivo substituído.");
          });
      }

      return updated;
    } catch (error) {
      if (stored) {
        await fileStorage
          .remove(DOCUMENT_CONTEXT, stored.storageKey)
          .catch(() => {
            console.error(
              "Falha ao remover arquivo órfão após erro ao atualizar metadados.",
            );
          });
      }

      throw error;
    }
  }

  async delete(id: string, providerId: string) {
    const document = await this.findById(id, providerId);

    await this.providerDocumentsRepository.delete(id);

    await fileStorage.remove(DOCUMENT_CONTEXT, document.storageKey).catch(() => {
      console.error(
        "Metadados excluídos, mas o arquivo armazenado não foi removido.",
      );
    });
  }

  async openFile(
    id: string,
    providerId: string,
    disposition: "inline" | "attachment",
  ) {
    const document = await this.findById(id, providerId);
    const mimeType = document.mimeType ?? "application/octet-stream";
    const effectiveDisposition =
      disposition === "inline" && allowsInlinePreview(mimeType)
        ? "inline"
        : "attachment";

    try {
      const opened = await fileStorage.open(
        DOCUMENT_CONTEXT,
        document.storageKey,
      );

      return {
        stream: opened.stream,
        sizeBytes: opened.sizeBytes,
        mimeType,
        contentDisposition: buildContentDisposition(
          effectiveDisposition,
          document.fileName,
        ),
      };
    } catch (error) {
      if (error instanceof ApiError && error.code === "INVALID_STORAGE_KEY") {
        throw new ApiError(
          "O arquivo deste documento não está disponível.",
          404,
          "FILE_NOT_FOUND",
        );
      }

      throw error;
    }
  }

  private async ensureProviderExists(providerId: string) {
    const provider = await this.providersRepository.findById(providerId);

    if (!provider) {
      throw new ApiError("Provedor não encontrado.", 404, "PROVIDER_NOT_FOUND");
    }

    return provider;
  }
}
