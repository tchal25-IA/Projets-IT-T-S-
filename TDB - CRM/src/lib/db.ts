import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

function connectionString() {
  const raw = process.env.DATABASE_URL ?? "";
  // Limite côté URL pour les DB Prisma create-db (quota très bas)
  if (!raw) return raw;
  try {
    const u = new URL(raw);
    if (!u.searchParams.has("connection_limit")) {
      u.searchParams.set("connection_limit", "1");
    }
    return u.toString();
  } catch {
    return raw;
  }
}

function createPrisma() {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;

  const pool =
    globalForPrisma.pool ??
    new Pool({
      connectionString: connectionString(),
      max: 1,
      idleTimeoutMillis: 5_000,
      connectionTimeoutMillis: 8_000,
      allowExitOnIdle: true,
    });
  globalForPrisma.pool = pool;

  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  globalForPrisma.prisma = prisma;
  return prisma;
}

export const prisma = createPrisma();
