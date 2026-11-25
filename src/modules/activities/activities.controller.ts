import type { Request, Response } from "express";

import { ApiError } from "../../shared/http/api-error.js";
import { successResponse } from "../../shared/http/api-response.js";
import {
  assignmentSchema,
  createActivitySchema,
  detachSchema,
  listActivitiesQuerySchema,
  placementSchema,
  updateActivitySchema,
} from "./activities.schemas.js";
import { ActivitiesService } from "./activities.service.js";

function routeParam(value: string | string[] | undefined, message: string) {
  if (!value || Array.isArray(value)) throw new ApiError(message, 400, "BAD_REQUEST");
  return value;
}

function actor(req: Request) {
  if (!req.user) throw new ApiError("Usuário não autenticado.", 401, "AUTH_TOKEN_MISSING");
  return req.user;
}

export class ActivitiesController {
  private readonly service = new ActivitiesService();

  listAssignableUsers = async (_req: Request, res: Response) => {
    const users = await this.service.listAssignableUsers();
    return successResponse(res, users, "Usuários listados com sucesso.");
  };

  create = async (req: Request, res: Response) => {
    const data = createActivitySchema.parse(req.body);
    const activity = await this.service.create(data);
    return successResponse(res, activity, "Atividade criada com sucesso.", 201);
  };

  findAll = async (req: Request, res: Response) => {
    const query = listActivitiesQuerySchema.parse(req.query);
    const activities = await this.service.findAll(query);
    return successResponse(res, activities, "Atividades listadas com sucesso.");
  };

  findById = async (req: Request, res: Response) => {
    const id = routeParam(req.params.id, "ID da atividade inválido.");
    const activity = await this.service.findById(id);
    return successResponse(res, activity, "Atividade encontrada com sucesso.");
  };

  update = async (req: Request, res: Response) => {
    const id = routeParam(req.params.id, "ID da atividade inválido.");
    const data = updateActivitySchema.parse(req.body);
    const activity = await this.service.update(id, data);
    return successResponse(res, activity, "Atividade atualizada com sucesso.");
  };

  assign = async (req: Request, res: Response) => {
    const id = routeParam(req.params.id, "ID da atividade inválido.");
    const data = assignmentSchema.parse(req.body);
    const activity = await this.service.assign(id, data);
    return successResponse(res, activity, "Responsável atribuído com sucesso.", 201);
  };

  removeAssignment = async (req: Request, res: Response) => {
    const id = routeParam(req.params.id, "ID da atividade inválido.");
    const assignmentId = routeParam(req.params.assignmentId, "ID da atribuição inválido.");
    const activity = await this.service.removeAssignment(id, assignmentId);
    return successResponse(res, activity, "Atribuição removida com sucesso.");
  };

  place = async (req: Request, res: Response) => {
    const id = routeParam(req.params.id, "ID da atividade inválido.");
    const data = placementSchema.parse(req.body);
    const activity = await this.service.place(actor(req), id, data);
    return successResponse(res, activity, "Atividade vinculada com sucesso.");
  };

  detach = async (req: Request, res: Response) => {
    const id = routeParam(req.params.id, "ID da atividade inválido.");
    const data = detachSchema.parse(req.body);
    const activity = await this.service.detach(actor(req), id, data);
    return successResponse(res, activity, "Atividade desvinculada com sucesso.");
  };

  start = async (req: Request, res: Response) => {
    const id = routeParam(req.params.id, "ID da atividade inválido.");
    const activity = await this.service.start(actor(req), id);
    return successResponse(res, activity, "Execução iniciada com sucesso.");
  };

  complete = async (req: Request, res: Response) => {
    const id = routeParam(req.params.id, "ID da atividade inválido.");
    const activity = await this.service.complete(actor(req), id);
    return successResponse(res, activity, "Atividade concluída com sucesso.");
  };
}
