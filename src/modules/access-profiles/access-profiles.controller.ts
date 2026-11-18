import type { Request, Response, NextFunction } from "express";
import { AccessProfilesService } from "./access-profiles.service.js";
import {
  createAccessProfileSchema,
  updateAccessProfileSchema,
} from "./access-profiles.schemas.js";
import { ApiError } from "../../shared/http/api-error.js";

const accessProfilesService = new AccessProfilesService();

export class AccessProfilesController {
  async findAll(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await accessProfilesService.findAll();

      return res.status(200).json({
        status: "success",
        message: "Perfis de acesso listados com sucesso.",
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async findPermissions(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await accessProfilesService.findPermissions();

      return res.status(200).json({
        status: "success",
        message: "Permissões listadas com sucesso.",
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;

      if (!id) {
        throw new ApiError(
          "ID do perfil não informado.",
          400,
          "INVALID_ACCESS_PROFILE_ID",
        );
      }

      const data = await accessProfilesService.findById(id);

      return res.status(200).json({
        status: "success",
        message: "Perfil de acesso encontrado com sucesso.",
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = createAccessProfileSchema.safeParse(req.body);

      if (!validation.success) {
        throw new ApiError(
          validation.error.issues[0]?.message ?? "Dados inválidos.",
          400,
          "VALIDATION_ERROR",
        );
      }

      const data = await accessProfilesService.create(validation.data);

      return res.status(201).json({
        status: "success",
        message: "Perfil de acesso criado com sucesso.",
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;

      if (!id) {
        throw new ApiError(
          "ID do perfil não informado.",
          400,
          "INVALID_ACCESS_PROFILE_ID",
        );
      }

      const validation = updateAccessProfileSchema.safeParse(req.body);

      if (!validation.success) {
        throw new ApiError(
          validation.error.issues[0]?.message ?? "Dados inválidos.",
          400,
          "VALIDATION_ERROR",
        );
      }

      const data = await accessProfilesService.update(id, validation.data);

      return res.status(200).json({
        status: "success",
        message: "Perfil de acesso atualizado com sucesso.",
        data,
      });
    } catch (error) {
      return next(error);
    }
  }
}

export const accessProfilesController = new AccessProfilesController();
