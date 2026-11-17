import path from "node:path";

const MAX_FILE_NAME_LENGTH = 255;

interface AllowedFileType {
  extensions: readonly string[];
  mimeType: string;
  matches: (buffer: Buffer) => boolean;
}

export interface AcceptedFile {
  fileName: string;
  extension: string;
  mimeType: string;
}

export type FileInspectionResult =
  | { ok: true; file: AcceptedFile }
  | { ok: false; code: string; message: string };

const INLINE_MIME_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "text/plain",
]);

function startsWithBytes(buffer: Buffer, bytes: number[]) {
  if (buffer.length < bytes.length) return false;

  return bytes.every((byte, index) => buffer[index] === byte);
}

function isZip(buffer: Buffer) {
  return (
    startsWithBytes(buffer, [0x50, 0x4b, 0x03, 0x04]) ||
    startsWithBytes(buffer, [0x50, 0x4b, 0x05, 0x06]) ||
    startsWithBytes(buffer, [0x50, 0x4b, 0x07, 0x08])
  );
}

function isOleCompoundFile(buffer: Buffer) {
  return startsWithBytes(buffer, [
    0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1,
  ]);
}

function containsAscii(buffer: Buffer, value: string) {
  return buffer.includes(Buffer.from(value));
}

function isUtf8Text(buffer: Buffer) {
  if (buffer.includes(0)) return false;

  try {
    new TextDecoder("utf-8", { fatal: true }).decode(buffer);
    return true;
  } catch {
    return false;
  }
}

const ALLOWED_FILE_TYPES: readonly AllowedFileType[] = [
  {
    extensions: ["pdf"],
    mimeType: "application/pdf",
    matches: (buffer) => buffer.subarray(0, 5).toString("ascii") === "%PDF-",
  },
  {
    extensions: ["png"],
    mimeType: "image/png",
    matches: (buffer) =>
      startsWithBytes(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  },
  {
    extensions: ["jpg", "jpeg"],
    mimeType: "image/jpeg",
    matches: (buffer) => startsWithBytes(buffer, [0xff, 0xd8, 0xff]),
  },
  {
    extensions: ["webp"],
    mimeType: "image/webp",
    matches: (buffer) =>
      buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
      buffer.subarray(8, 12).toString("ascii") === "WEBP",
  },
  {
    extensions: ["gif"],
    mimeType: "image/gif",
    matches: (buffer) => {
      const header = buffer.subarray(0, 6).toString("ascii");
      return header === "GIF87a" || header === "GIF89a";
    },
  },
  {
    extensions: ["txt"],
    mimeType: "text/plain",
    matches: isUtf8Text,
  },
  {
    extensions: ["doc"],
    mimeType: "application/msword",
    matches: isOleCompoundFile,
  },
  {
    extensions: ["xls"],
    mimeType: "application/vnd.ms-excel",
    matches: isOleCompoundFile,
  },
  {
    extensions: ["docx"],
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    matches: (buffer) => isZip(buffer) && containsAscii(buffer, "word/"),
  },
  {
    extensions: ["xlsx"],
    mimeType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    matches: (buffer) => isZip(buffer) && containsAscii(buffer, "xl/"),
  },
];

function fileBaseName(originalName: string) {
  const leaf = originalName.split(/[/\\]/).pop() ?? "";
  const hasCodePointAboveLatin1 = [...leaf].some(
    (char) => char.charCodeAt(0) > 255,
  );
  const decoded = hasCodePointAboveLatin1
    ? leaf
    : Buffer.from(leaf, "latin1").toString("utf8");

  return path
    .win32.basename(path.posix.basename(decoded))
    .replace(/[\u0000-\u001f]/g, "")
    .trim();
}

function limitFileName(fileName: string) {
  if (fileName.length <= MAX_FILE_NAME_LENGTH) return fileName;

  const extension = path.posix.extname(fileName);
  const maxBaseLength = Math.max(MAX_FILE_NAME_LENGTH - extension.length, 1);

  return `${fileName.slice(0, maxBaseLength)}${extension}`.slice(
    0,
    MAX_FILE_NAME_LENGTH,
  );
}

export function allowsInlinePreview(mimeType: string) {
  return INLINE_MIME_TYPES.has(mimeType);
}

export function inspectFile(
  buffer: Buffer,
  originalName: string,
): FileInspectionResult {
  if (buffer.length === 0) {
    return {
      ok: false,
      code: "FILE_EMPTY",
      message: "O arquivo está vazio.",
    };
  }

  const fileName = limitFileName(fileBaseName(originalName));

  if (!fileName || fileName === "." || fileName === "..") {
    return {
      ok: false,
      code: "FILE_NAME_INVALID",
      message: "O nome do arquivo é inválido.",
    };
  }

  const extension = path.posix.extname(fileName).slice(1).toLowerCase();
  const allowedType = ALLOWED_FILE_TYPES.find((type) =>
    type.extensions.includes(extension),
  );

  if (!allowedType) {
    return {
      ok: false,
      code: "FILE_TYPE_NOT_ALLOWED",
      message:
        "Tipo de arquivo não permitido. Envie PDF, imagem, TXT ou documento do Office.",
    };
  }

  if (!allowedType.matches(buffer)) {
    return {
      ok: false,
      code: "FILE_CONTENT_MISMATCH",
      message: "O conteúdo do arquivo não corresponde à extensão informada.",
    };
  }

  return {
    ok: true,
    file: {
      fileName,
      extension,
      mimeType: allowedType.mimeType,
    },
  };
}
