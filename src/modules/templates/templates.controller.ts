import type { Request, Response } from "express";

import { ApiError } from "../../shared/http/api-error.js";
import { successResponse } from "../../shared/http/api-response.js";
import {
  createActivitySchema,
  createStageSchema,
  createTemplateSchema,
  listTemplatesQuerySchema,
  reorderSchema,
  requirementSchema,
  updateActivitySchema,
  updateStageSchema,
  updateTemplateSchema,
  updateTemplateStatusSchema,
} from "./templates.schemas.js";
import { TemplatesService } from "./templates.service.js";

function routeParam(value: string | string[] | undefined, message: string) {
  if (!value || Array.isArray(value)) {
    throw new ApiError(message, 400, "BAD_REQUEST");
  }

  return value;
}

export class TemplatesController {
  private readonly templatesService = new TemplatesService();

  create = async (req: Request, res: Response) => {
    const data = createTemplateSchema.parse(req.body);
    const template = await this.templatesService.create(data);

    return successResponse(res, template, "Template cadastrado com sucesso.", 201);
  };

  findAll = async (req: Request, res: Response) => {
    const query = listTemplatesQuerySchema.parse(req.query);
    const templates = await this.templatesService.findAll(query.status);

    return successResponse(res, templates, "Templates listados com sucesso.");
  };

  findById = async (req: Request, res: Response) => {
    const id = routeParam(req.params.id, "ID do template inválido.");
    const template = await this.templatesService.findById(id);

    return successResponse(res, template, "Template encontrado com sucesso.");
  };

  update = async (req: Request, res: Response) => {
    const id = routeParam(req.params.id, "ID do template inválido.");
    const data = updateTemplateSchema.parse(req.body);
    const template = await this.templatesService.update(id, data);

    return successResponse(res, template, "Template atualizado com sucesso.");
  };

  updateStatus = async (req: Request, res: Response) => {
    const id = routeParam(req.params.id, "ID do template inválido.");
    const data = updateTemplateStatusSchema.parse(req.body);
    const template = await this.templatesService.updateStatus(id, data.status);

    return successResponse(res, template, "Status do template atualizado com sucesso.");
  };

  delete = async (req: Request, res: Response) => {
    const id = routeParam(req.params.id, "ID do template inválido.");
    await this.templatesService.delete(id);

    return successResponse(res, null, "Template excluído com sucesso.");
  };

  createStage = async (req: Request, res: Response) => {
    const templateId = routeParam(req.params.templateId, "ID do template inválido.");
    const data = createStageSchema.parse(req.body);
    const stage = await this.templatesService.createStage(templateId, data);

    return successResponse(res, stage, "Etapa cadastrada com sucesso.", 201);
  };

  updateStage = async (req: Request, res: Response) => {
    const templateId = routeParam(req.params.templateId, "ID do template inválido.");
    const stageId = routeParam(req.params.stageId, "ID da etapa inválido.");
    const data = updateStageSchema.parse(req.body);
    const stage = await this.templatesService.updateStage(templateId, stageId, data);

    return successResponse(res, stage, "Etapa atualizada com sucesso.");
  };

  deleteStage = async (req: Request, res: Response) => {
    const templateId = routeParam(req.params.templateId, "ID do template inválido.");
    const stageId = routeParam(req.params.stageId, "ID da etapa inválido.");
    await this.templatesService.deleteStage(templateId, stageId);

    return successResponse(res, null, "Etapa excluída com sucesso.");
  };

  reorderStages = async (req: Request, res: Response) => {
    const templateId = routeParam(req.params.templateId, "ID do template inválido.");
    const data = reorderSchema.parse(req.body);
    await this.templatesService.reorderStages(templateId, data);

    return successResponse(res, null, "Etapas reordenadas com sucesso.");
  };

  createActivity = async (req: Request, res: Response) => {
    const templateId = routeParam(req.params.templateId, "ID do template inválido.");
    const stageId = routeParam(req.params.stageId, "ID da etapa inválido.");
    const data = createActivitySchema.parse(req.body);
    const activity = await this.templatesService.createActivity(
      templateId,
      stageId,
      data,
    );

    return successResponse(res, activity, "Atividade cadastrada com sucesso.", 201);
  };

  updateActivity = async (req: Request, res: Response) => {
    const templateId = routeParam(req.params.templateId, "ID do template inválido.");
    const stageId = routeParam(req.params.stageId, "ID da etapa inválido.");
    const activityId = routeParam(req.params.activityId, "ID da atividade inválido.");
    const data = updateActivitySchema.parse(req.body);
    const activity = await this.templatesService.updateActivity(
      templateId,
      stageId,
      activityId,
      data,
    );

    return successResponse(res, activity, "Atividade atualizada com sucesso.");
  };

  deleteActivity = async (req: Request, res: Response) => {
    const templateId = routeParam(req.params.templateId, "ID do template inválido.");
    const stageId = routeParam(req.params.stageId, "ID da etapa inválido.");
    const activityId = routeParam(req.params.activityId, "ID da atividade inválido.");
    await this.templatesService.deleteActivity(templateId, stageId, activityId);

    return successResponse(res, null, "Atividade excluída com sucesso.");
  };

  reorderActivities = async (req: Request, res: Response) => {
    const templateId = routeParam(req.params.templateId, "ID do template inválido.");
    const stageId = routeParam(req.params.stageId, "ID da etapa inválido.");
    const data = reorderSchema.parse(req.body);
    await this.templatesService.reorderActivities(templateId, stageId, data);

    return successResponse(res, null, "Atividades reordenadas com sucesso.");
  };

  createRequirement = async (req: Request, res: Response) => {
    const templateId = routeParam(req.params.templateId, "ID do template inválido.");
    const stageId = routeParam(req.params.stageId, "ID da etapa inválido.");
    const activityId = routeParam(req.params.activityId, "ID da atividade inválido.");
    const data = requirementSchema.parse(req.body);
    const requirement = await this.templatesService.createRequirement(
      templateId,
      stageId,
      activityId,
      data,
    );

    return successResponse(res, requirement, "Requisito cadastrado com sucesso.", 201);
  };

  updateRequirement = async (req: Request, res: Response) => {
    const templateId = routeParam(req.params.templateId, "ID do template inválido.");
    const stageId = routeParam(req.params.stageId, "ID da etapa inválido.");
    const activityId = routeParam(req.params.activityId, "ID da atividade inválido.");
    const requirementId = routeParam(
      req.params.requirementId,
      "ID do requisito inválido.",
    );
    const data = requirementSchema.parse(req.body);
    const requirement = await this.templatesService.updateRequirement(
      templateId,
      stageId,
      activityId,
      requirementId,
      data,
    );

    return successResponse(res, requirement, "Requisito atualizado com sucesso.");
  };

  deleteRequirement = async (req: Request, res: Response) => {
    const templateId = routeParam(req.params.templateId, "ID do template inválido.");
    const stageId = routeParam(req.params.stageId, "ID da etapa inválido.");
    const activityId = routeParam(req.params.activityId, "ID da atividade inválido.");
    const requirementId = routeParam(
      req.params.requirementId,
      "ID do requisito inválido.",
    );
    await this.templatesService.deleteRequirement(
      templateId,
      stageId,
      activityId,
      requirementId,
    );

    return successResponse(res, null, "Requisito excluído com sucesso.");
  };

  reorderRequirements = async (req: Request, res: Response) => {
    const templateId = routeParam(req.params.templateId, "ID do template inválido.");
    const stageId = routeParam(req.params.stageId, "ID da etapa inválido.");
    const activityId = routeParam(req.params.activityId, "ID da atividade inválido.");
    const data = reorderSchema.parse(req.body);
    await this.templatesService.reorderRequirements(
      templateId,
      stageId,
      activityId,
      data,
    );

    return successResponse(res, null, "Requisitos reordenados com sucesso.");
  };
}
