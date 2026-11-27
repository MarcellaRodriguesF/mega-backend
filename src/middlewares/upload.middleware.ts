import type { NextFunction, Request, Response } from "express";
import multer from "multer";

import { env } from "../config/env.js";
import { ApiError } from "../shared/http/api-error.js";

function formatMaxSize(bytes: number) {
  if (bytes % (1024 * 1024) === 0) {
    return `${bytes / (1024 * 1024)} MB`;
  }

  if (bytes % 1024 === 0) {
    return `${bytes / 1024} KB`;
  }

  return `${bytes} bytes`;
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.fileMaxSizeBytes,
    files: 1,
    fields: 8,
    parts: 12,
  },
});

const parseSingleFile = upload.single("file");

export function uploadSingleFile(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  parseSingleFile(req, res, (error: unknown) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      next(
        new ApiError(
          `O arquivo excede o tamanho máximo de ${formatMaxSize(env.fileMaxSizeBytes)}.`,
          413,
          "FILE_TOO_LARGE",
        ),
      );
      return;
    }

    next(
      new ApiError(
        "Não foi possível processar o arquivo enviado.",
        400,
        "FILE_UPLOAD_ERROR",
      ),
    );
  });
}
