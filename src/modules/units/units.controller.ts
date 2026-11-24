
import type { Request, Response } from "express";

import { UnitsService } from "./units.service.js";
import {
  createUnitSchema,
  listCompanyUnitsQuerySchema,
  updateUnitSchema,
} from "./units.schemas.js";
import { successResponse } from "../../shared/http/api-response.js";

export class UnitsController {
  private readonly unitsService = new UnitsService();

  create = async (req: Request, res: Response) => {
    const data = createUnitSchema.parse(req.body);

    const unit = await this.unitsService.create(data);

    return successResponse(
      res,
      unit,
      "Unidade cadastrada com sucesso.",
      201,
    );
  };

  findByCompanyId = async (req: Request, res: Response) => {
    const companyId = req.params.companyId;

    if (!companyId || Array.isArray(companyId)) {
      throw new Error("ID da empresa inválido.");
    }

    const query = listCompanyUnitsQuerySchema.parse({
      search: typeof req.query.search === "string" ? req.query.search : undefined,
      status: typeof req.query.status === "string" ? req.query.status : undefined,
    });

    const units = await this.unitsService.findByCompanyId(companyId, query);

    return successResponse(
      res,
      units,
      "Unidades da empresa listadas com sucesso.",
    );
  };

  findAll = async (_req: Request, res: Response) => {
    const units = await this.unitsService.findAll();

    return successResponse(
      res,
      units,
      "Unidades listadas com sucesso.",
    );
  };

  findById = async (req: Request, res: Response) => {
    const id = req.params.id;

    if (!id || Array.isArray(id)) {
      throw new Error("ID da unidade inválido.");
    }

    const unit = await this.unitsService.findById(id);

    return successResponse(
      res,
      unit,
      "Unidade encontrada com sucesso.",
    );
  };

  update = async (req: Request, res: Response) => {
    const id = req.params.id;

    if (!id || Array.isArray(id)) {
      throw new Error("ID da unidade inválido.");
    }

    const data = updateUnitSchema.parse(req.body);

    const unit = await this.unitsService.update(id, data);

    return successResponse(
      res,
      unit,
      "Unidade atualizada com sucesso.",
    );
  };

  delete = async (req: Request, res: Response) => {
    const id = req.params.id;

    if (!id || Array.isArray(id)) {
      throw new Error("ID da unidade inválido.");
    }

    await this.unitsService.delete(id);

    return successResponse(
      res,
      null,
      "Unidade excluída com sucesso.",
    );
  };
}
