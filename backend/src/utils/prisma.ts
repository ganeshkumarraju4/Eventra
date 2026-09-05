// src/utils/prisma.ts
import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client";

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

const adapter = new PrismaMariaDb({
  host: requireEnv("DB_HOST"),
  user: requireEnv("DB_USER"),
  password: requireEnv("DB_PASSWORD"),
  database: requireEnv("DB_NAME"),
  port: Number(requireEnv("DB_PORT")),
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT) || 5,
});

const prisma = new PrismaClient({ adapter });

export default prisma;