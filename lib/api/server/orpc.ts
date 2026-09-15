import { implement } from "@orpc/server";
import type { RateLimitHandlerPluginContext } from "@orpc/ratelimit";
import { contract } from "@/lib/api/contract";
import type { Principal } from "@/lib/auth/principal";
import { prisma, type PrismaClient } from "@/lib/db/client";

/**
 * What every procedure receives as `context`. It is created fresh for each
 * request (see `createContext`) and never stored globally. `principal` is
 * filled in by the auth middleware.
 */
export type ApiContext = {
  db: PrismaClient;
  principal?: Principal;
} & RateLimitHandlerPluginContext;

/** Context after `requireAuth` ran: the caller is known. */
export type AuthedContext = ApiContext & { principal: Principal };

export function createContext(): ApiContext {
  return { db: prisma };
}

/** The server side of the contract: every procedure in `contract` must be implemented from here. */
export const implementer = implement(contract).$context<ApiContext>();
