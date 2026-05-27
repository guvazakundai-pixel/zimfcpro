import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient() {
  const useTurso = process.env.TURSO_DATABASE_URL && process.env.USE_TURSO === "true";

  if (useTurso) {
    if (!process.env.DATABASE_URL || process.env.DATABASE_URL.startsWith("file:")) {
      process.env.DATABASE_URL = process.env.TURSO_DATABASE_URL;
    }
    const libsql = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    const adapter = new PrismaLibSQL(libsql);
    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    });
  }

  const dbPath = process.env.DATABASE_URL || "file:./prisma/dev.db";
  const url = dbPath.startsWith("file:") ? dbPath : `file:${dbPath}`;
  process.env.DATABASE_URL = url;
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export function getPrisma() {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

export const prisma = getPrisma();