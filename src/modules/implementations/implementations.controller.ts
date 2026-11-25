import type { Request, Response } from "express";

import { ApiError } from "../../shared/http/api-error.js";
import { successResponse } from "../../shared/http/api-response.js";
import {
  catalogUnitsQuerySchema,
  createImplementationSchema,
  listImplementationsQuerySchema,
  reorderStagesSchema,
  stageSchema,
  updateImplementationSchema,
} from "./implementations.schemas.js";
import { ImplementationsService } from "./implementations.service.js";

function routeParam(value: string | string[] | undefined, message: string) {
  if (!value || Array.isArray(value)) {
    throw new ApiError(message, 400, "BAD_REQUEST");
  }
  return value;
}

export class ImplementationsController {
  private readonly service = new ImplementationsService();

  create = async (req: Request, res: Response) => {
    const data = createImplementationSchema.parse(req.body);
    const implementation = await this.service.create(data);
    return successResponse(res, implementation, "Implantação criada com sucesso.", 201);
  };

  findAll = async (req: Request, res: Response) => {
    const query = listImplementationsQuerySchema.parse(req.query);
    const implementations = await this.service.findAll(query);
    return successResponse(res, implementations, "Implantações listadas com sucesso.");
  };

  findById = async (req: Request, res: Response) => {
    const id = routeParam(req.params.id, "ID da implantação inválido.");
    const implementation = await this.service.findById(id);
    return successResponse(res, implementation, "Implantação encontrada com sucesso.");
  };

  update = async (req: Request, res: Response) => {
    const id = routeParam(req.params.id, "ID da implantação inválido.");
    const data = updateImplementationSchema.parse(req.body);
    const implementation = await this.service.update(id, data);
    return successResponse(res, implementation, "Implantação atualizada com sucesso.");
  };

  cancel = async (req: Request, res: Response) => {
    const id = routeParam(req.params.id, "ID da implantação inválido.");
    const implementation = await this.service.cancel(id);
    return successResponse(res, implementation, "Implantação cancelada com sucesso.");
  };

  listPublishedTemplates = async (_req: Request, res: Response) => {
    const templates = await this.service.listPublishedTemplates();
    return successResponse(res, templates, "Templates publicados listados com sucesso.");
  };

  previewTemplate = async (req: Request, res: Response) => {
    const id = routeParam(req.params.id, "ID do template inválido.");
    const template = await this.service.previewTemplate(id);
    return successResponse(res, template, "Prévia do template carregada com sucesso.");
  };

  listUnits = async (req: Request, res: Response) => {
    const query = catalogUnitsQuerySchema.parse(req.query);
    const units = await this.service.listUnits(query);
    return successResponse(res, units, "Unidades listadas com sucesso.");
  };

  listCompanies = async (_req: Request, res: Response) => {
    const companies = await this.service.listCompanies();
    return successResponse(res, companies, "Clientes listados com sucesso.");
  };

  createStage = async (req: Request, res: Response) => {
    const id = routeParam(req.params.id, "ID da implantação inválido.");
    const data = stageSchema.parse(req.body);
    const stage = await this.service.createStage(id, data);
    return successResponse(res, stage, "Etapa criada com sucesso.", 201);
  };

  updateStage = async (req: Request, res: Response) => {
    const id = routeParam(req.params.id, "ID da implantação inválido.");
    const stageId = routeParam(req.params.stageId, "ID da etapa inválido.");
    const data = stageSchema.parse(req.body);
    const stage = await this.service.updateStage(id, stageId, data);
    return successResponse(res, stage, "Etapa atualizada com sucesso.");
  };

  deleteStage = async (req: Request, res: Response) => {
    const id = routeParam(req.params.id, "ID da implantação inválido.");
    const stageId = routeParam(req.params.stageId, "ID da etapa inválido.");
    await this.service.deleteStage(id, stageId);
    return successResponse(res, null, "Etapa removida com sucesso.");
  };

  reorderStages = async (req: Request, res: Response) => {
    const id = routeParam(req.params.id, "ID da implantação inválido.");
    const data = reorderStagesSchema.parse(req.body);
    await this.service.reorderStages(id, data);
    return successResponse(res, null, "Etapas reordenadas com sucesso.");
  };
}
