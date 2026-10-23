import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";

import { ApiError } from "../shared/http/api-error.js";

export const errorMiddleware: ErrorRequestHandler = (
  error,
  _req,
  res,
  next,
) => {
  if (res.headersSent) {
    return next(error);
  }

  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({
      status: "error",
      message: error.message,
      error: {
        code: error.code,
        ...(error.details ? { details: error.details } : {}),
      },
    });
  }

  if (error instanceof ZodError) {
    return res.status(422).json({
      status: "error",
      message: "Os dados enviados são inválidos.",
      error: {
        code: "VALIDATION_ERROR",
        details: error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      },
    });
  }

  if (error instanceof SyntaxError && "body" in error) {
    return res.status(400).json({
      status: "error",
      message: "O corpo da requisição contém JSON inválido.",
      error: {
        code: "INVALID_JSON",
      },
    });
  }

  console.error("Erro não tratado:", error);

  return res.status(500).json({
    status: "error",
    message: "Ocorreu um erro interno. Tente novamente.",
    error: {
      code: "INTERNAL_SERVER_ERROR",
    },
  });
};
