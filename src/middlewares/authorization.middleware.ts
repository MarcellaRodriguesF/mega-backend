import type { Request, Response, NextFunction } from "express";

import { AuthorizationRepository } from "../modules/authorization/authorization.repository.js";
import { ApiError } from "../shared/http/api-error.js";
import { PermissionCode } from "../modules/authorization/authorization.permissions.js";

const authorizationRepository = new AuthorizationRepository();

export function authorizePermission(permissionCode: PermissionCode) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new ApiError(
          "Usuário não autenticado.",
          401,
          "AUTH_TOKEN_MISSING",
        );
      }

      const hasPermission = await authorizationRepository.hasPermission(
        req.user.accessProfileId,
        permissionCode,
      );

      if (!hasPermission) {
        throw new ApiError(
          "Você não possui permissão para realizar esta operação.",
          403,
          "FORBIDDEN",
        );
      }

      return next();
    } catch (error) {
      return next(error);
    }
  };
}
