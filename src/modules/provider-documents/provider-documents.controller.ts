import type { Request, Response } from "express";

import { ApiError } from "../../shared/http/api-error.js";
import { successResponse } from "../../shared/http/api-response.js";
import { ProviderDocumentsService } from "./provider-documents.service.js";
import {
  createProviderDocumentFieldsSchema,
  updateProviderDocumentFieldsSchema,
} from "./provider-documents.schemas.js";

function readRouteId(value: string | string[] | undefined, label: string) {
  if (!value || Array.isArray(value)) {
    throw new Error(`${label} inválido.`);
  }

  return value;
}

function readUploadedFile(req: Request) {
  const file = req.file;

  if (!file?.buffer) return undefined;

  return {
    buffer: file.buffer,
    originalName: file.originalname,
  };
}

export class ProviderDocumentsController {
  private readonly providerDocumentsService = new ProviderDocumentsService();

  create = async (req: Request, res: Response) => {
    const providerId = readRouteId(req.params.providerId, "ID do provedor");
    const fields = createProviderDocumentFieldsSchema.parse(req.body);
    const file = readUploadedFile(req);

    if (!file) {
      throw new ApiError("Selecione um arquivo.", 422, "FILE_REQUIRED");
    }

    const document = await this.providerDocumentsService.create(
      providerId,
      fields,
      file,
    );

    return successResponse(
      res,
      document,
      "Documento cadastrado com sucesso.",
      201,
    );
  };

  findAllByProvider = async (req: Request, res: Response) => {
    const providerId = readRouteId(req.params.providerId, "ID do provedor");
    const documents =
      await this.providerDocumentsService.findAllByProvider(providerId);

    return successResponse(res, documents, "Documentos listados com sucesso.");
  };

  findById = async (req: Request, res: Response) => {
    const providerId = readRouteId(req.params.providerId, "ID do provedor");
    const id = readRouteId(req.params.id, "ID do documento");
    const document = await this.providerDocumentsService.findById(
      id,
      providerId,
    );

    return successResponse(res, document, "Documento encontrado com sucesso.");
  };

  download = async (req: Request, res: Response) => {
    const providerId = readRouteId(req.params.providerId, "ID do provedor");
    const id = readRouteId(req.params.id, "ID do documento");
    const disposition = req.query.disposition === "inline" ? "inline" : "attachment";
    const file = await this.providerDocumentsService.openFile(
      id,
      providerId,
      disposition,
    );

    res.status(200);
    res.setHeader("Content-Type", file.mimeType);
    res.setHeader("Content-Length", String(file.sizeBytes));
    res.setHeader("Content-Disposition", file.contentDisposition);
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "private, no-store");
    res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");

    file.stream.on("error", () => {
      console.error("Falha ao transmitir arquivo armazenado.");

      if (!res.headersSent) {
        res.status(500).json({
          status: "error",
          message: "Não foi possível ler o arquivo armazenado.",
          error: {
            code: "FILE_STORAGE_ERROR",
          },
        });
        return;
      }

      res.destroy();
    });

    res.on("close", () => {
      file.stream.destroy();
    });

    file.stream.pipe(res);
  };

  update = async (req: Request, res: Response) => {
    const providerId = readRouteId(req.params.providerId, "ID do provedor");
    const id = readRouteId(req.params.id, "ID do documento");
    const fields = updateProviderDocumentFieldsSchema.parse(req.body);
    const file = readUploadedFile(req);

    if (
      !file &&
      fields.name === undefined &&
      fields.observations === undefined
    ) {
      throw new ApiError(
        "Informe pelo menos um campo para atualização.",
        422,
        "VALIDATION_ERROR",
      );
    }

    const document = await this.providerDocumentsService.update(
      id,
      providerId,
      fields,
      file,
    );

    return successResponse(res, document, "Documento atualizado com sucesso.");
  };

  delete = async (req: Request, res: Response) => {
    const providerId = readRouteId(req.params.providerId, "ID do provedor");
    const id = readRouteId(req.params.id, "ID do documento");

    await this.providerDocumentsService.delete(id, providerId);

    return successResponse(res, null, "Documento excluído com sucesso.");
  };
}
