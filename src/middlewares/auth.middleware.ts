import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

interface AuthTokenPayload {
  sub: string;
  accessProfileId: string;
}

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authorization = req.headers.authorization;

  if (!authorization) {
    return res.status(401).json({
      error: {
        code: "AUTH_TOKEN_MISSING",
        message: "Token de autenticação não informado.",
      },
    });
  }

  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({
      error: {
        code: "AUTH_TOKEN_INVALID",
        message: "Formato do token de autenticação inválido.",
      },
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET as string,
    ) as AuthTokenPayload;

    req.user = {
      id: decoded.sub,
      accessProfileId: decoded.accessProfileId,
    };

    return next();
  } catch {
    return res.status(401).json({
      error: {
        code: "AUTH_TOKEN_INVALID",
        message: "Token de autenticação inválido ou expirado.",
      },
    });
  }
}
