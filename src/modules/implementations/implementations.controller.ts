import type { Request, Response } from "express";

import { ApiError } from "../../shared/http/api-error.js";
import { successResponse } from "../../shared/http/api-response.js";
import {
  catalogUnitsQuerySchema,
  createImplementationSchema,
  listImplementationsQuerySchema,
} from "./implementations.schemas.js";
import { ImplementationsService } from "./implementations.service.js";

function routeParam(value: string | string[] | undefined, message: string) {
  if (!value || Array.isArray(value)) {
    throw new ApiError(message, 400, "BAD_REQUEST");
  }

  return value;
}

export class ImplementationsController {
  private readonly implementationsService = new ImplementationsService();

  create = async (req: Request, res: Response) => {
    const data = createImplementationSchema.parse(req.body);
    const implementation = await this.implementationsService.create(data);

    return successResponse(
      res,
      implementation,
      "Implantação criada com sucesso.",
      201,
    );
  };

  findAll = async (req: Request, res: Response) => {
    const query = listImplementationsQuerySchema.parse(req.query);
    const implementations = await this.implementationsService.findAll(query);

    return successResponse(
      res,
      implementations,
      "Implantações listadas com sucesso.",
    );
  };

  findById = async (req: Request, res: Response) => {
    const id = routeParam(req.params.id, "ID da implantação inválido.");
    const implementation = await this.implementationsService.findById(id);

    return successResponse(
      res,
      implementation,
      "Implantação encontrada com sucesso.",
    );
  };

  listPublishedTemplates = async (_req: Request, res: Response) => {
    const templates = await this.implementationsService.listPublishedTemplates();

    return successResponse(
      res,
      templates,
      "Templates publicados listados com sucesso.",
    );
  };

  listUnits = async (req: Request, res: Response) => {
    const query = catalogUnitsQuerySchema.parse(req.query);
    const units = await this.implementationsService.listUnits(query);

    return successResponse(res, units, "Unidades listadas com sucesso.");
  };
}
