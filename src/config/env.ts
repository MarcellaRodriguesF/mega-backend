import "dotenv/config";
import path from "node:path";

const requiredEnv = [
  "DATABASE_URL",
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
] as const;

const MAX_FILE_SIZE_BYTES = 2_147_483_647;

function readFileMaxSizeBytes() {
  const raw = process.env.FILE_MAX_SIZE_BYTES ?? String(10 * 1024 * 1024);
  const value = Number(raw);

  if (!Number.isInteger(value) || value <= 0 || value > MAX_FILE_SIZE_BYTES) {
    throw new Error(
      "Variável de ambiente inválida: FILE_MAX_SIZE_BYTES. Use um inteiro positivo de até 2147483647.",
    );
  }

  return value;
}

for (const envName of requiredEnv) {
  if (!process.env[envName]) {
    throw new Error(
      `Variável de ambiente obrigatória não definida: ${envName}`,
    );
  }
}

export const env = {
  databaseUrl: process.env.DATABASE_URL,
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? "15m",
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "7d",
  port: Number(process.env.PORT ?? 3000),
  fileStoragePath: path.resolve(
    process.env.FILE_STORAGE_PATH?.trim() || "storage",
  ),
  fileMaxSizeBytes: readFileMaxSizeBytes(),
};
