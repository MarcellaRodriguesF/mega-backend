import type { Response } from "express";
import type { ReadStream } from "node:fs";

interface StreamedFile {
  stream: ReadStream;
  sizeBytes: number;
  mimeType: string;
  contentDisposition: string;
}

export function streamStoredFile(res: Response, file: StreamedFile) {
  res.status(200);
  res.setHeader("Content-Type", file.mimeType);
  res.setHeader("Content-Length", String(file.sizeBytes));
  res.setHeader("Content-Disposition", file.contentDisposition);
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");

  file.stream.on("error", () => {
    console.error("Falha ao transmitir arquivo armazenado.");

    if (!res.headersSent) {
      res.status(500).json({
        status: "error",
        message: "Não foi possível ler o arquivo armazenado.",
        error: { code: "FILE_STORAGE_ERROR" },
      });
      return;
    }

    res.destroy();
  });

  res.on("close", () => file.stream.destroy());
  file.stream.pipe(res);
}
