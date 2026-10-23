import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

interface AuthTokenPayload {
  sub: string;
  accessProfileId: string;
}

function getTokenFromRequest(req: Request): string | null {
  // Prioriza o cookie de sessão.
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

  // Mantém compatibilidade com chamadas que usam Bearer token.
  const authorization = req.headers.authorization;

  if (authorization) {
    const [scheme, token] = authorization.split(" ");

    if (scheme === "Bearer" && token) {
      return token;
    }
  }

  return null;
}

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const token = getTokenFromRequest(req);

  if (!token) {
    return res.status(401).json({
      error: {
        code: "AUTH_TOKEN_MISSING",
        message: "Token de autenticação não informado.",
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
