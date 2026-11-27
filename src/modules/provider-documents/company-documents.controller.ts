import type { Request, Response } from "express";

import { ApiError } from "../../shared/http/api-error.js";
import { successResponse } from "../../shared/http/api-response.js";
import { streamStoredFile } from "../../shared/storage/stream-stored-file.js";
import { ProviderDocumentsService } from "./provider-documents.service.js";
import {
  createCompanyDocumentFieldsSchema,
  updateCompanyDocumentFieldsSchema,
} from "./provider-documents.schemas.js";

function readRouteId(value: string | string[] | undefined, label: string) {
  if (!value || Array.isArray(value)) {
    throw new ApiError(`${label} inválido.`, 400, "BAD_REQUEST");
  }

  return value;
}

function readUploadedFile(req: Request) {
  const file = req.file;
  if (!file?.buffer) return undefined;

  return { buffer: file.buffer, originalName: file.originalname };
}

export class CompanyDocumentsController {
  private readonly documentsService = new ProviderDocumentsService();

  create = async (req: Request, res: Response) => {
    const companyId = readRouteId(req.params.companyId, "ID da empresa");
    const fields = createCompanyDocumentFieldsSchema.parse(req.body);
    const file = readUploadedFile(req);

    if (!file) {
      throw new ApiError("Selecione um arquivo.", 422, "FILE_REQUIRED");
    }

    const document = await this.documentsService.createForCompany(
      companyId,
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

  findAll = async (req: Request, res: Response) => {
    const companyId = readRouteId(req.params.companyId, "ID da empresa");
    const documents = await this.documentsService.findAllByCompany(companyId);
    return successResponse(res, documents, "Documentos listados com sucesso.");
  };

  findById = async (req: Request, res: Response) => {
    const companyId = readRouteId(req.params.companyId, "ID da empresa");
    const id = readRouteId(req.params.id, "ID do documento");
    const document = await this.documentsService.findByCompany(id, companyId);
    return successResponse(res, document, "Documento encontrado com sucesso.");
  };

  download = async (req: Request, res: Response) => {
    const companyId = readRouteId(req.params.companyId, "ID da empresa");
    const id = readRouteId(req.params.id, "ID do documento");
    const disposition =
      req.query.disposition === "inline" ? "inline" : "attachment";
    const file = await this.documentsService.openCompanyFile(
      id,
      companyId,
      disposition,
    );

    streamStoredFile(res, file);
  };

  update = async (req: Request, res: Response) => {
    const companyId = readRouteId(req.params.companyId, "ID da empresa");
    const id = readRouteId(req.params.id, "ID do documento");
    const fields = updateCompanyDocumentFieldsSchema.parse(req.body);
    const file = readUploadedFile(req);

    if (
      !file &&
      fields.name === undefined &&
      fields.type === undefined &&
      fields.unitId === undefined &&
      fields.observations === undefined
    ) {
      throw new ApiError(
        "Informe pelo menos um campo para atualização.",
        422,
        "VALIDATION_ERROR",
      );
    }

    const document = await this.documentsService.updateForCompany(
      id,
      companyId,
      fields,
      file,
    );

    return successResponse(res, document, "Documento atualizado com sucesso.");
  };

  delete = async (req: Request, res: Response) => {
    const companyId = readRouteId(req.params.companyId, "ID da empresa");
    const id = readRouteId(req.params.id, "ID do documento");
    await this.documentsService.deleteForCompany(id, companyId);
    return successResponse(res, null, "Documento excluído com sucesso.");
  };
}
