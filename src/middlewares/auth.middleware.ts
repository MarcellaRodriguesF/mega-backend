import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { AuthRepository } from "../modules/auth/auth.repository.js";
import { ApiError } from "../shared/http/api-error.js";

interface AuthTokenPayload {
  sub: string;
  accessProfileId: string;
}

const authRepository = new AuthRepository();

function getTokenFromRequest(req: Request): string | null {
  const cookies = req.headers.cookie;

  if (cookies) {
    const sessionCookie = cookies
      .split(";")
      .map((cookie) => cookie.trim())
      .find((cookie) => cookie.startsWith("mega_session="));

    if (sessionCookie) {
      const token = sessionCookie.slice("mega_session=".length);

      if (token) {
        return decodeURIComponent(token);
      }
    }
  }

  const authorization = req.headers.authorization;

  if (authorization) {
    const [scheme, token] = authorization.split(" ");

    if (scheme === "Bearer" && token) {
      return token;
    }
  }

  return null;
}

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const token = getTokenFromRequest(req);

    if (!token) {
      throw new ApiError(
        "Token de autenticação não informado.",
        401,
        "AUTH_TOKEN_MISSING",
      );
    }

    const secret = process.env.JWT_ACCESS_SECRET;

    if (!secret) {
      throw new ApiError(
        "Configuração de autenticação não encontrada.",
        500,
        "AUTH_CONFIG_ERROR",
      );
    }

    let decoded: AuthTokenPayload;

    try {
      const payload = jwt.verify(token, secret);

      if (
        typeof payload === "string" ||
        !payload.sub ||
        !payload.accessProfileId
      ) {
        throw new Error("Payload inválido.");
      }

      decoded = payload as AuthTokenPayload;
    } catch {
      throw new ApiError(
        "Token de autenticação inválido ou expirado.",
        401,
        "AUTH_TOKEN_INVALID",
      );
    }

    const user = await authRepository.findById(decoded.sub);

    if (!user || user.status !== "ACTIVE") {
      throw new ApiError(
        "Usuário não encontrado ou inativo.",
        401,
        "USER_INACTIVE",
      );
    }

    if (user.accessProfile.status !== "ACTIVE") {
      throw new ApiError(
        "Perfil de acesso inativo.",
        403,
        "ACCESS_PROFILE_INACTIVE",
      );
    }

    req.user = {
      id: user.id,
      accessProfileId: user.accessProfileId,
    };

    return next();
  } catch (error) {
    return next(error);
  }
}
