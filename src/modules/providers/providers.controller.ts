import type { Request, Response } from "express";

import { ProvidersService } from "./providers.service.js";
import {
  createProviderSchema,
  updateProviderSchema,
} from "./providers.schemas.js";
import { successResponse } from "../../shared/http/api-response.js";

export class ProvidersController {
  private readonly providersService = new ProvidersService();

  create = async (req: Request, res: Response) => {
    const data = createProviderSchema.parse(req.body);

    const provider = await this.providersService.create(data);

    return successResponse(
      res,
      provider,
      "Provedor cadastrado com sucesso.",
      201,
    );
  };

  findAll = async (_req: Request, res: Response) => {
    const providers = await this.providersService.findAll();

    return successResponse(res, providers, "Provedores listados com sucesso.");
  };

  findById = async (req: Request, res: Response) => {
    const id = req.params.id;

    if (!id || Array.isArray(id)) {
      throw new Error("ID do provedor inválido.");
    }

    const provider = await this.providersService.findById(id);

    return successResponse(res, provider, "Provedor encontrado com sucesso.");
  };

  update = async (req: Request, res: Response) => {
    const id = req.params.id;

    if (!id || Array.isArray(id)) {
      throw new Error("ID do provedor inválido.");
    }

    const data = updateProviderSchema.parse(req.body);

    const provider = await this.providersService.update(id, data);

    return successResponse(res, provider, "Provedor atualizado com sucesso.");
  };

  delete = async (req: Request, res: Response) => {
    const id = req.params.id;

    if (!id || Array.isArray(id)) {
      throw new Error("ID do provedor inválido.");
    }

    await this.providersService.delete(id);

    return successResponse(res, null, "Provedor excluído com sucesso.");
  };
}
