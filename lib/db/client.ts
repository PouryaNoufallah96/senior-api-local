import "server-only";

import path from "node:path";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/lib/db/generated/client";

export type { PrismaClient } from "@/lib/db/generated/client";

/**
 * With `prisma.config.ts` the Prisma CLI resolves relative `file:` URLs
 * against the project root (the process cwd). Resolve to an absolute path the
 * same way so the runtime opens the exact file the migrations were applied to.
 */
export function resolveDatabaseUrl(url: string | undefined): string {
  const value = url ?? "file:./dev.db";
  if (!value.startsWith("file:")) return value;
  const filePath = value.slice("file:".length);
  if (filePath === ":memory:" || path.isAbsolute(filePath)) return value;
  return `file:${path.resolve(process.cwd(), filePath)}`;
}

export function createPrismaClient(databaseUrl?: string): PrismaClient {
  const adapter = new PrismaBetterSqlite3({
    url: resolveDatabaseUrl(databaseUrl ?? process.env.DATABASE_URL),
  });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/**
 * Process-wide Prisma client. This holds connection state only, never
 * request- or user-specific state; per-request data lives in the API context.
 */
export const prisma: PrismaClient =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
