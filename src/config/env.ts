import "dotenv/config";

const requiredEnv = [
  "DATABASE_URL",
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
] as const;

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
};
