import { randomUUID } from "node:crypto";
import { createReadStream, type ReadStream } from "node:fs";
import { mkdir, realpath, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";

import { env } from "../../config/env.js";
import { ApiError } from "../http/api-error.js";
import { inspectFile } from "./file-signature.js";
import type {
  IncomingStoredFile,
  StorageContext,
  StoredFile,
} from "./storage.types.js";

const STORAGE_KEY_PATTERN =
  /^(documents|evidences)\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.[a-z0-9]+$/;

export interface OpenedStoredFile {
  stream: ReadStream;
  sizeBytes: number;
}

function pathsEqual(left: string, right: string) {
  if (process.platform === "win32") {
    return left.toLowerCase() === right.toLowerCase();
  }

  return left === right;
}

function isInsideDirectory(parent: string, candidate: string) {
  const base = parent.endsWith(path.sep) ? parent : `${parent}${path.sep}`;

  if (process.platform === "win32") {
    return candidate.toLowerCase().startsWith(base.toLowerCase());
  }

  return candidate.startsWith(base);
}

function errorCode(error: unknown) {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = error.code;
    return typeof code === "string" ? code : undefined;
  }

  return undefined;
}

export class FileStorageService {
  async save(
    context: StorageContext,
    file: IncomingStoredFile,
  ): Promise<StoredFile> {
    if (file.buffer.length > env.fileMaxSizeBytes) {
      throw new ApiError(
        "O arquivo excede o tamanho máximo permitido.",
        413,
        "FILE_TOO_LARGE",
      );
    }

    const inspection = inspectFile(file.buffer, file.originalName);

    if (!inspection.ok) {
      throw new ApiError(inspection.message, 422, inspection.code);
    }

    const storageKey = `${context}/${randomUUID()}.${inspection.file.extension}`;
    const absolutePath = await this.resolvePath(context, storageKey, {
      createDirectory: true,
    });

    try {
      await writeFile(absolutePath, file.buffer, { flag: "wx" });
    } catch (error) {
      await rm(absolutePath, { force: true }).catch(() => undefined);
      console.error("Falha ao gravar arquivo armazenado.");
      throw new ApiError(
        "Não foi possível armazenar o arquivo.",
        500,
        "FILE_STORAGE_ERROR",
      );
    }

    return {
      storageKey,
      fileName: inspection.file.fileName,
      mimeType: inspection.file.mimeType,
      sizeBytes: file.buffer.length,
    };
  }

  async open(
    context: StorageContext,
    storageKey: string,
  ): Promise<OpenedStoredFile> {
    const absolutePath = await this.resolvePath(context, storageKey, {
      createDirectory: false,
    });

    try {
      const fileStat = await stat(absolutePath);

      if (!fileStat.isFile()) {
        throw new ApiError(
          "O arquivo deste documento não está disponível.",
          404,
          "FILE_NOT_FOUND",
        );
      }

      return {
        stream: createReadStream(absolutePath),
        sizeBytes: fileStat.size,
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;

      if (errorCode(error) === "ENOENT") {
        throw new ApiError(
          "O arquivo deste documento não está disponível.",
          404,
          "FILE_NOT_FOUND",
        );
      }

      console.error("Falha ao abrir arquivo armazenado.");
      throw new ApiError(
        "Não foi possível ler o arquivo armazenado.",
        500,
        "FILE_STORAGE_ERROR",
      );
    }
  }

  async remove(context: StorageContext, storageKey: string) {
    if (!this.belongsToContext(context, storageKey)) {
      console.error("Remoção ignorada porque a referência está fora do contexto.");
      return;
    }

    let absolutePath: string;

    try {
      absolutePath = await this.resolvePath(context, storageKey, {
        createDirectory: false,
      });
    } catch (error) {
      if (error instanceof ApiError && error.code === "FILE_NOT_FOUND") {
        return;
      }

      throw error;
    }

    try {
      await rm(absolutePath, { force: true });
    } catch (error) {
      console.error("Falha ao remover arquivo armazenado.");
      throw new ApiError(
        "Não foi possível remover o arquivo armazenado.",
        500,
        "FILE_STORAGE_ERROR",
      );
    }
  }

  private belongsToContext(context: StorageContext, storageKey: string) {
    return (
      STORAGE_KEY_PATTERN.test(storageKey) &&
      storageKey.startsWith(`${context}/`)
    );
  }

  private async resolvePath(
    context: StorageContext,
    storageKey: string,
    options: { createDirectory: boolean },
  ) {
    if (!this.belongsToContext(context, storageKey)) {
      throw new ApiError(
        "Referência de arquivo inválida.",
        400,
        "INVALID_STORAGE_KEY",
      );
    }

    const root = env.fileStoragePath;
    const segments = storageKey.split("/");
    const absolutePath = path.resolve(root, ...segments);

    if (!isInsideDirectory(root, absolutePath)) {
      throw new ApiError(
        "Referência de arquivo inválida.",
        400,
        "INVALID_STORAGE_KEY",
      );
    }

    const contextDirectory = path.resolve(root, context);
    const storedFileName = segments[1];

    if (!storedFileName) {
      throw new ApiError(
        "Referência de arquivo inválida.",
        400,
        "INVALID_STORAGE_KEY",
      );
    }

    if (options.createDirectory) {
      try {
        await mkdir(contextDirectory, { recursive: true });
      } catch {
        console.error("Falha ao preparar o diretório de armazenamento.");
        throw new ApiError(
          "Não foi possível armazenar o arquivo.",
          500,
          "FILE_STORAGE_ERROR",
        );
      }
    }

    let realRoot: string;
    let realContext: string;

    try {
      realRoot = await realpath(root);
      realContext = await realpath(contextDirectory);
    } catch (error) {
      if (errorCode(error) === "ENOENT") {
        throw new ApiError(
          "O arquivo deste documento não está disponível.",
          404,
          "FILE_NOT_FOUND",
        );
      }

      console.error("Falha ao resolver o diretório de armazenamento.");
      throw new ApiError(
        "O armazenamento de arquivos não está disponível.",
        500,
        "FILE_STORAGE_ERROR",
      );
    }

    if (!isInsideDirectory(realRoot, realContext) && !pathsEqual(realRoot, realContext)) {
      throw new ApiError(
        "Referência de arquivo inválida.",
        400,
        "INVALID_STORAGE_KEY",
      );
    }

    const parentDirectory = path.dirname(absolutePath);
    let realParent: string;

    try {
      realParent = await realpath(parentDirectory);
    } catch (error) {
      if (errorCode(error) === "ENOENT") {
        throw new ApiError(
          "O arquivo deste documento não está disponível.",
          404,
          "FILE_NOT_FOUND",
        );
      }

      throw new ApiError(
        "O armazenamento de arquivos não está disponível.",
        500,
        "FILE_STORAGE_ERROR",
      );
    }

    if (!pathsEqual(realParent, realContext)) {
      throw new ApiError(
        "Referência de arquivo inválida.",
        400,
        "INVALID_STORAGE_KEY",
      );
    }

    if (path.basename(absolutePath) !== storedFileName) {
      throw new ApiError(
        "Referência de arquivo inválida.",
        400,
        "INVALID_STORAGE_KEY",
      );
    }

    return absolutePath;
  }
}

export const fileStorage = new FileStorageService();
