import type { Request, Response } from "express";

import { CompaniesService } from "./companies.service.js";
import {
  createCompanySchema,
  updateCompanySchema,
} from "./companies.schemas.js";
import { successResponse } from "../../shared/http/api-response.js";

export class CompaniesController {
  private readonly companiesService = new CompaniesService();

  create = async (req: Request, res: Response) => {
    const data = createCompanySchema.parse(req.body);

    const company = await this.companiesService.create(data);

    return successResponse(
      res,
      company,
      "Empresa cadastrada com sucesso.",
      201,
    );
  };

  findAll = async (_req: Request, res: Response) => {
    const companies = await this.companiesService.findAll();

    return successResponse(res, companies, "Empresas listadas com sucesso.");
  };

  findById = async (req: Request, res: Response) => {
    const id = req.params.id;

    if (!id || Array.isArray(id)) {
      throw new Error("ID da empresa inválido.");
    }

    const company = await this.companiesService.findById(id);

    return successResponse(res, company, "Empresa encontrada com sucesso.");
  };

  update = async (req: Request, res: Response) => {
    const id = req.params.id;

    if (!id || Array.isArray(id)) {
      throw new Error("ID da empresa inválido.");
    }

    const data = updateCompanySchema.parse(req.body);

    const company = await this.companiesService.update(id, data);

    return successResponse(res, company, "Empresa atualizada com sucesso.");
  };
}
