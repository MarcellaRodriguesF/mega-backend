import type { Request, Response } from "express";

import { ProviderContactsService } from "./provider-contacts.service.js";
import {
  createProviderContactSchema,
  updateProviderContactSchema,
} from "./provider-contacts.schemas.js";

import { successResponse } from "../../shared/http/api-response.js";

export class ProviderContactsController {
  private readonly providerContactsService = new ProviderContactsService();

  create = async (req: Request, res: Response) => {
    const providerId = req.params.providerId;

    if (!providerId || Array.isArray(providerId)) {
      throw new Error("ID do provedor inválido.");
    }

    const data = createProviderContactSchema.parse(req.body);

    const contact = await this.providerContactsService.create(providerId, data);

    return successResponse(
      res,
      contact,
      "Contato cadastrado com sucesso.",
      201,
    );
  };

  findAllByProvider = async (req: Request, res: Response) => {
    const providerId = req.params.providerId;

    if (!providerId || Array.isArray(providerId)) {
      throw new Error("ID do provedor inválido.");
    }

    const contacts =
      await this.providerContactsService.findAllByProvider(providerId);

    return successResponse(res, contacts, "Contatos listados com sucesso.");
  };

  findById = async (req: Request, res: Response) => {
    const providerId = req.params.providerId;
    const id = req.params.id;

    if (!providerId || Array.isArray(providerId) || !id || Array.isArray(id)) {
      throw new Error("ID do provedor ou do contato inválido.");
    }

    const contact = await this.providerContactsService.findById(id, providerId);

    return successResponse(res, contact, "Contato encontrado com sucesso.");
  };

  update = async (req: Request, res: Response) => {
    const providerId = req.params.providerId;
    const id = req.params.id;

    if (!providerId || Array.isArray(providerId) || !id || Array.isArray(id)) {
      throw new Error("ID do provedor ou do contato inválido.");
    }

    const data = updateProviderContactSchema.parse(req.body);

    const contact = await this.providerContactsService.update(
      id,
      providerId,
      data,
    );

    return successResponse(res, contact, "Contato atualizado com sucesso.");
  };

  delete = async (req: Request, res: Response) => {
    const providerId = req.params.providerId;
    const id = req.params.id;

    if (!providerId || Array.isArray(providerId) || !id || Array.isArray(id)) {
      throw new Error("ID do provedor ou do contato inválido.");
    }

    await this.providerContactsService.delete(id, providerId);

    return successResponse(res, null, "Contato excluído com sucesso.");
  };
}
