import type { Request, Response } from "express";

import { ProviderDocumentsService } from "./provider-documents.service.js";
import {
  createProviderDocumentSchema,
  updateProviderDocumentSchema,
} from "./provider-documents.schemas.js";

import { successResponse } from "../../shared/http/api-response.js";

export class ProviderDocumentsController {
  private readonly providerDocumentsService = new ProviderDocumentsService();

  create = async (req: Request, res: Response) => {
    const providerId = req.params.providerId;

    if (!providerId || Array.isArray(providerId)) {
      throw new Error("ID do provedor inválido.");
    }

    const data = createProviderDocumentSchema.parse(req.body);

    const document = await this.providerDocumentsService.create(
      providerId,
      data,
    );

    return successResponse(
      res,
      document,
      "Documento cadastrado com sucesso.",
      201,
    );
  };

  findAllByProvider = async (req: Request, res: Response) => {
    const providerId = req.params.providerId;

    if (!providerId || Array.isArray(providerId)) {
      throw new Error("ID do provedor inválido.");
    }

    const documents =
      await this.providerDocumentsService.findAllByProvider(providerId);

    return successResponse(res, documents, "Documentos listados com sucesso.");
  };

  findById = async (req: Request, res: Response) => {
    const providerId = req.params.providerId;
    const id = req.params.id;

    if (!providerId || Array.isArray(providerId) || !id || Array.isArray(id)) {
      throw new Error("ID do provedor ou do documento inválido.");
    }

    const document = await this.providerDocumentsService.findById(
      id,
      providerId,
    );

    return successResponse(res, document, "Documento encontrado com sucesso.");
  };

  update = async (req: Request, res: Response) => {
    const providerId = req.params.providerId;
    const id = req.params.id;

    if (!providerId || Array.isArray(providerId) || !id || Array.isArray(id)) {
      throw new Error("ID do provedor ou do documento inválido.");
    }

    const data = updateProviderDocumentSchema.parse(req.body);

    const document = await this.providerDocumentsService.update(
      id,
      providerId,
      data,
    );

    return successResponse(res, document, "Documento atualizado com sucesso.");
  };

  delete = async (req: Request, res: Response) => {
    const providerId = req.params.providerId;
    const id = req.params.id;

    if (!providerId || Array.isArray(providerId) || !id || Array.isArray(id)) {
      throw new Error("ID do provedor ou do documento inválido.");
    }

    await this.providerDocumentsService.delete(id, providerId);

    return successResponse(res, null, "Documento excluído com sucesso.");
  };
}
