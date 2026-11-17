
import type { Request, Response } from "express";

import { UnitConnectivitiesService } from "./unit-connectivities.service.js";
import {
  createUnitConnectivitySchema,
  updateUnitConnectivitySchema,
} from "./unit-connectivities.schemas.js";
import { successResponse } from "../../shared/http/api-response.js";

export class UnitConnectivitiesController {
  private readonly service = new UnitConnectivitiesService();

  create = async (req: Request, res: Response) => {
    const data = createUnitConnectivitySchema.parse(req.body);

    const connectivity = await this.service.create(data);

    return successResponse(
      res,
      connectivity,
      "Conectividade cadastrada com sucesso.",
      201,
    );
  };

  findAll = async (_req: Request, res: Response) => {
    const connectivities = await this.service.findAll();

    return successResponse(
      res,
      connectivities,
      "Conectividades listadas com sucesso.",
    );
  };

  findById = async (req: Request, res: Response) => {
    const id = req.params.id;

    if (!id || Array.isArray(id)) {
      throw new Error("ID da conectividade inválido.");
    }

    const connectivity = await this.service.findById(id);

    return successResponse(
      res,
      connectivity,
      "Conectividade encontrada com sucesso.",
    );
  };

  findByUnitId = async (req: Request, res: Response) => {
    const unitId = req.params.unitId;

    if (!unitId || Array.isArray(unitId)) {
      throw new Error("ID da unidade inválido.");
    }

    const connectivities = await this.service.findByUnitId(unitId);

    return successResponse(
      res,
      connectivities,
      "Conectividades da unidade listadas com sucesso.",
    );
  };

  update = async (req: Request, res: Response) => {
    const id = req.params.id;

    if (!id || Array.isArray(id)) {
      throw new Error("ID da conectividade inválido.");
    }

    const data = updateUnitConnectivitySchema.parse(req.body);

    const connectivity = await this.service.update(id, data);

    return successResponse(
      res,
      connectivity,
      "Conectividade atualizada com sucesso.",
    );
  };

  delete = async (req: Request, res: Response) => {
    const id = req.params.id;

    if (!id || Array.isArray(id)) {
      throw new Error("ID da conectividade inválido.");
    }

    await this.service.delete(id);

    return successResponse(
      res,
      null,
      "Conectividade excluída com sucesso.",
    );
  };
}
