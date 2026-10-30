import type { Request, Response, NextFunction } from "express";

import { AuthorizationRepository } from "../modules/authorization/authorization.repository.js";
import { ApiError } from "../shared/http/api-error.js";

const authorizationRepository = new AuthorizationRepository();

export function requirePermission(permissionCode: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new ApiError("Autenticação necessária.", 401, "UNAUTHORIZED");
      }

      const hasPermission = await authorizationRepository.hasPermission(
        req.user.accessProfileId,
        permissionCode,
      );

      if (!hasPermission) {
        throw new ApiError(
          "Você não tem permissão para realizar esta ação.",
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
