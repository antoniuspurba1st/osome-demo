import dotenv from "dotenv";
import fs from "fs";
import path from "path";

const cwd = process.cwd();
const nodeEnv = process.env.NODE_ENV ?? "development";

const envFiles = [".env", `.env.${nodeEnv}`, ".env.local"]
  .map((fileName) => path.join(cwd, fileName))
  .filter((filePath) => fs.existsSync(filePath));

for (const filePath of envFiles) {
  dotenv.config({ path: filePath, override: true });
}

const parseNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const env = {
  NODE_ENV: nodeEnv,
  PORT: parseNumber(process.env.PORT, 3000),
  DB_HOST: process.env.DB_HOST ?? "127.0.0.1",
  DB_PORT: parseNumber(process.env.DB_PORT, 5432),
  DB_USER: process.env.DB_USER ?? "postgres",
  DB_PASSWORD: process.env.DB_PASSWORD ?? "postgres",
  DB_NAME: process.env.DB_NAME ?? "osome_demo",
  LOG_LEVEL: process.env.LOG_LEVEL ?? "info",
};
