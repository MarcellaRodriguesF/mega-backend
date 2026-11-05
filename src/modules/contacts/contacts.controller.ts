import type { Request, Response } from "express";

import { ContactsService } from "./contacts.service.js";
import {
  createContactSchema,
  updateContactSchema,
} from "./contacts.schemas.js";

import { successResponse } from "../../shared/http/api-response.js";

export class ContactsController {
  private readonly contactsService = new ContactsService();

  create = async (req: Request, res: Response) => {
    const companyId = req.params.companyId;

    if (!companyId || Array.isArray(companyId)) {
      throw new Error("ID da empresa inválido.");
    }

    const data = createContactSchema.parse(req.body);

    const contact = await this.contactsService.create(companyId, data);

    return successResponse(
      res,
      contact,
      "Contato cadastrado com sucesso.",
      201,
    );
  };

  findAllByCompany = async (req: Request, res: Response) => {
    const companyId = req.params.companyId;

    if (!companyId || Array.isArray(companyId)) {
      throw new Error("ID da empresa inválido.");
    }

    const contacts = await this.contactsService.findAllByCompany(companyId);

    return successResponse(res, contacts, "Contatos listados com sucesso.");
  };

  findById = async (req: Request, res: Response) => {
    const companyId = req.params.companyId;
    const id = req.params.id;

    if (!companyId || Array.isArray(companyId) || !id || Array.isArray(id)) {
      throw new Error("ID da empresa ou do contato inválido.");
    }

    const contact = await this.contactsService.findById(id, companyId);

    return successResponse(res, contact, "Contato encontrado com sucesso.");
  };

  update = async (req: Request, res: Response) => {
    const companyId = req.params.companyId;
    const id = req.params.id;

    if (!companyId || Array.isArray(companyId) || !id || Array.isArray(id)) {
      throw new Error("ID da empresa ou do contato inválido.");
    }

    const data = updateContactSchema.parse(req.body);

    const contact = await this.contactsService.update(id, companyId, data);

    return successResponse(res, contact, "Contato atualizado com sucesso.");
  };

  delete = async (req: Request, res: Response) => {
    const companyId = req.params.companyId;
    const id = req.params.id;

    if (!companyId || Array.isArray(companyId) || !id || Array.isArray(id)) {
      throw new Error("ID da empresa ou do contato inválido.");
    }

    await this.contactsService.delete(id, companyId);

    return successResponse(res, null, "Contato excluído com sucesso.");
  };
}
