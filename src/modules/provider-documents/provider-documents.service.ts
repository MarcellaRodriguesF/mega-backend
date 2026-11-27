import { ApiError } from "../../shared/http/api-error.js";
import { prisma } from "../../database/prisma.js";
import { buildContentDisposition } from "../../shared/storage/content-disposition.js";
import { allowsInlinePreview } from "../../shared/storage/file-signature.js";
import { fileStorage } from "../../shared/storage/file-storage.service.js";
import type { IncomingStoredFile } from "../../shared/storage/storage.types.js";
import { ProvidersRepository } from "../providers/providers.repository.js";
import { ProviderDocumentsRepository } from "./provider-documents.repository.js";

import type {
  CreateCompanyDocumentFields,
  CreateProviderDocumentFields,
  UpdateCompanyDocumentFields,
  UpdateProviderDocumentFields,
} from "./provider-documents.schemas.js";

const DOCUMENT_CONTEXT = "documents" as const;
type StoredDocument = NonNullable<
  Awaited<ReturnType<ProviderDocumentsRepository["findById"]>>
>;

export class ProviderDocumentsService {
  private readonly providerDocumentsRepository =
    new ProviderDocumentsRepository();
  private readonly providersRepository = new ProvidersRepository();

  async findAllByProvider(providerId: string) {
    await this.ensureProviderExists(providerId);

    return this.providerDocumentsRepository.findAllByProvider(providerId);
  }

  async findAllByCompany(companyId: string) {
    await this.ensureCompanyExists(companyId);
    return this.providerDocumentsRepository.findAllByCompany(companyId);
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

  async findByCompany(id: string, companyId: string) {
    await this.ensureCompanyExists(companyId);

    const document = await this.providerDocumentsRepository.findByCompany(
      id,
      companyId,
    );

    if (!document) {
      throw new ApiError(
        "Documento não encontrado.",
        404,
        "COMPANY_DOCUMENT_NOT_FOUND",
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
        companyId: null,
        unitId: null,
        name: fields.name,
        type: fields.type,
        observations: fields.observations,
        fileName: stored.fileName,
        storageKey: stored.storageKey,
        mimeType: stored.mimeType,
        sizeBytes: stored.sizeBytes,
      });
    } catch (error) {
      await fileStorage
        .remove(DOCUMENT_CONTEXT, stored.storageKey)
        .catch(() => {
          console.error(
            "Falha ao remover arquivo órfão após erro ao salvar metadados.",
          );
        });

      throw error;
    }
  }

  async createForCompany(
    companyId: string,
    fields: CreateCompanyDocumentFields,
    file: IncomingStoredFile,
  ) {
    await this.ensureCompanyExists(companyId);
    await this.ensureUnitBelongsToCompany(fields.unitId, companyId);

    const stored = await fileStorage.save(DOCUMENT_CONTEXT, file);

    try {
      return await this.providerDocumentsRepository.create({
        providerId: null,
        companyId,
        unitId: fields.unitId ?? null,
        name: fields.name,
        type: fields.type,
        observations: fields.observations,
        fileName: stored.fileName,
        storageKey: stored.storageKey,
        mimeType: stored.mimeType,
        sizeBytes: stored.sizeBytes,
      });
    } catch (error) {
      await fileStorage
        .remove(DOCUMENT_CONTEXT, stored.storageKey)
        .catch(() => {
          console.error(
            "Falha ao remover arquivo órfão após erro ao salvar metadados.",
          );
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
    const stored = file ? await fileStorage.save(DOCUMENT_CONTEXT, file) : null;

    try {
      const updated = await this.providerDocumentsRepository.update(id, {
        ...(fields.name !== undefined ? { name: fields.name } : {}),
        ...(fields.type !== undefined ? { type: fields.type } : {}),
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

  async updateForCompany(
    id: string,
    companyId: string,
    fields: UpdateCompanyDocumentFields,
    file?: IncomingStoredFile,
  ) {
    const current = await this.findByCompany(id, companyId);
    if (fields.unitId !== undefined) {
      await this.ensureUnitBelongsToCompany(fields.unitId, companyId);
    }

    const stored = file ? await fileStorage.save(DOCUMENT_CONTEXT, file) : null;
    let updated: Awaited<ReturnType<ProviderDocumentsRepository["update"]>>;

    try {
      updated = await this.providerDocumentsRepository.update(id, {
        ...(fields.name !== undefined ? { name: fields.name } : {}),
        ...(fields.type !== undefined ? { type: fields.type } : {}),
        ...(fields.observations !== undefined
          ? { observations: fields.observations }
          : {}),
        ...(fields.unitId !== undefined ? { unitId: fields.unitId } : {}),
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

    const updatedDocument =
      await this.providerDocumentsRepository.findByCompany(id, companyId);
    return updatedDocument ?? updated;
  }

  async delete(id: string, providerId: string) {
    const document = await this.findById(id, providerId);

    await this.providerDocumentsRepository.delete(id);

    await fileStorage
      .remove(DOCUMENT_CONTEXT, document.storageKey)
      .catch(() => {
        console.error(
          "Metadados excluídos, mas o arquivo armazenado não foi removido.",
        );
      });
  }

  async deleteForCompany(id: string, companyId: string) {
    const document = await this.findByCompany(id, companyId);

    await this.providerDocumentsRepository.delete(id);
    await fileStorage
      .remove(DOCUMENT_CONTEXT, document.storageKey)
      .catch(() => {
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
    return this.openStoredDocument(document, disposition);
  }

  async openCompanyFile(
    id: string,
    companyId: string,
    disposition: "inline" | "attachment",
  ) {
    const document = await this.findByCompany(id, companyId);
    return this.openStoredDocument(document, disposition);
  }

  private async openStoredDocument(
    document: StoredDocument,
    disposition: "inline" | "attachment",
  ) {
    if (!document) {
      throw new ApiError(
        "Documento não encontrado.",
        404,
        "DOCUMENT_NOT_FOUND",
      );
    }

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

  private async ensureCompanyExists(companyId: string) {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true },
    });

    if (!company) {
      throw new ApiError("Empresa não encontrada.", 404, "COMPANY_NOT_FOUND");
    }

    return company;
  }

  private async ensureUnitBelongsToCompany(
    unitId: string | null | undefined,
    companyId: string,
  ) {
    if (!unitId) return;

    const unit = await prisma.unit.findFirst({
      where: { id: unitId, companyId },
      select: { id: true },
    });

    if (!unit) {
      throw new ApiError(
        "A unidade selecionada não pertence a esta empresa.",
        422,
        "COMPANY_DOCUMENT_UNIT_MISMATCH",
      );
    }
  }
}
