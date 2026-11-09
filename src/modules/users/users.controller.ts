import type { Request, Response } from "express";

import { UsersService } from "./users.service.js";
import { createUserSchema, updateUserSchema } from "./users.schemas.js";

import { successResponse } from "../../shared/http/api-response.js";
import { ApiError } from "../../shared/http/api-error.js";

export class UsersController {
  private readonly usersService = new UsersService();

  create = async (req: Request, res: Response) => {
    const data = createUserSchema.parse(req.body);

    const user = await this.usersService.create(data);

    return successResponse(res, user, "Usuário cadastrado com sucesso.", 201);
  };

  findAll = async (_req: Request, res: Response) => {
    const users = await this.usersService.findAll();

    return successResponse(res, users, "Usuários listados com sucesso.");
  };

  findById = async (req: Request, res: Response) => {
    const id = req.params.id;

    if (!id || Array.isArray(id)) {
      throw new ApiError("ID do usuário inválido.", 400, "USER_ID_INVALID");
    }

    const user = await this.usersService.findById(id);

    return successResponse(res, user, "Usuário encontrado com sucesso.");
  };

  update = async (req: Request, res: Response) => {
    const id = req.params.id;

    if (!id || Array.isArray(id)) {
      throw new ApiError("ID do usuário inválido.", 400, "USER_ID_INVALID");
    }

    const data = updateUserSchema.parse(req.body);

    const user = await this.usersService.update(id, data);

    return successResponse(res, user, "Usuário atualizado com sucesso.");
  };
}
