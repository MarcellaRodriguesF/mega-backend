import type { Request, Response } from "express";

import { ApiError } from "../../shared/http/api-error.js";
import { successResponse } from "../../shared/http/api-response.js";
import {
  createFormTemplateSchema,
  formFieldSchema,
  listFormTemplatesQuerySchema,
  reorderFormFieldsSchema,
  updateFormTemplateSchema,
  updateFormTemplateStatusSchema,
} from "./form-templates.schemas.js";
import { FormTemplatesService } from "./form-templates.service.js";

function routeParam(value: string | string[] | undefined, message: string) {
  if (!value || Array.isArray(value)) {
    throw new ApiError(message, 400, "BAD_REQUEST");
  }

  return value;
}

export class FormTemplatesController {
  private readonly formTemplatesService = new FormTemplatesService();

  create = async (req: Request, res: Response) => {
    const data = createFormTemplateSchema.parse(req.body);
    const formTemplate = await this.formTemplatesService.create(data);

    return successResponse(
      res,
      formTemplate,
      "Formulário cadastrado com sucesso.",
      201,
    );
  };

  findAll = async (req: Request, res: Response) => {
    const query = listFormTemplatesQuerySchema.parse(req.query);
    const formTemplates = await this.formTemplatesService.findAll(query.status);

    return successResponse(res, formTemplates, "Formulários listados com sucesso.");
  };

  findById = async (req: Request, res: Response) => {
    const id = routeParam(req.params.id, "ID do formulário inválido.");
    const formTemplate = await this.formTemplatesService.findById(id);

    return successResponse(res, formTemplate, "Formulário encontrado com sucesso.");
  };

  update = async (req: Request, res: Response) => {
    const id = routeParam(req.params.id, "ID do formulário inválido.");
    const data = updateFormTemplateSchema.parse(req.body);
    const formTemplate = await this.formTemplatesService.update(id, data);

    return successResponse(res, formTemplate, "Formulário atualizado com sucesso.");
  };

  updateStatus = async (req: Request, res: Response) => {
    const id = routeParam(req.params.id, "ID do formulário inválido.");
    const data = updateFormTemplateStatusSchema.parse(req.body);
    const formTemplate = await this.formTemplatesService.updateStatus(id, data);

    return successResponse(
      res,
      formTemplate,
      "Status do formulário atualizado com sucesso.",
    );
  };

  delete = async (req: Request, res: Response) => {
    const id = routeParam(req.params.id, "ID do formulário inválido.");
    await this.formTemplatesService.delete(id);

    return successResponse(res, null, "Formulário excluído com sucesso.");
  };

  createField = async (req: Request, res: Response) => {
    const formTemplateId = routeParam(
      req.params.formTemplateId,
      "ID do formulário inválido.",
    );
    const data = formFieldSchema.parse(req.body);
    const field = await this.formTemplatesService.createField(formTemplateId, data);

    return successResponse(res, field, "Campo cadastrado com sucesso.", 201);
  };

  updateField = async (req: Request, res: Response) => {
    const formTemplateId = routeParam(
      req.params.formTemplateId,
      "ID do formulário inválido.",
    );
    const fieldId = routeParam(req.params.fieldId, "ID do campo inválido.");
    const data = formFieldSchema.parse(req.body);
    const field = await this.formTemplatesService.updateField(
      formTemplateId,
      fieldId,
      data,
    );

    return successResponse(res, field, "Campo atualizado com sucesso.");
  };

  deleteField = async (req: Request, res: Response) => {
    const formTemplateId = routeParam(
      req.params.formTemplateId,
      "ID do formulário inválido.",
    );
    const fieldId = routeParam(req.params.fieldId, "ID do campo inválido.");
    await this.formTemplatesService.deleteField(formTemplateId, fieldId);

    return successResponse(res, null, "Campo excluído com sucesso.");
  };

  reorderFields = async (req: Request, res: Response) => {
    const formTemplateId = routeParam(
      req.params.formTemplateId,
      "ID do formulário inválido.",
    );
    const data = reorderFormFieldsSchema.parse(req.body);
    await this.formTemplatesService.reorderFields(formTemplateId, data);

    return successResponse(res, null, "Campos reordenados com sucesso.");
  };
}
