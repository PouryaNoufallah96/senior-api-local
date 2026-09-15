import { ratelimit } from "@orpc/ratelimit";
import { MemoryRateLimiter } from "@orpc/ratelimit/memory";
import { ORPCError, ValidationError } from "@orpc/server";
import { implementer, type AuthedContext } from "@/lib/api/server/orpc";
import { getSession } from "@/lib/auth/kinde";
import { resolvePrincipal } from "@/lib/services/identity";

/**
 * Turns everything a procedure can throw into one of our typed errors.
 * - oRPC's own input validation failure becomes INPUT_VALIDATION_FAILED (422) with a list of issues.
 * - Errors we threw on purpose (ORPCError) pass through untouched.
 * - Anything else is logged and hidden behind a generic 500.
 */
export const errorBoundary = implementer.middleware(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error instanceof ORPCError && error.code === "BAD_REQUEST" && error.cause instanceof ValidationError) {
      throw new ORPCError("INPUT_VALIDATION_FAILED", {
        data: {
          issues: error.cause.issues.map((issue) => ({
            path: (issue.path ?? []).join("."),
            message: issue.message,
          })),
        },
      });
    }

    if (error instanceof ORPCError && error.code !== "INTERNAL_SERVER_ERROR") {
      throw error;
    }

    console.error("Unhandled API error", error);
    throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Something went wrong", cause: error });
  }
});

/** Reads the Kinde session and loads the caller as `context.principal`, or fails with UNAUTHORIZED. */
export const requireAuth = implementer.middleware(async ({ context, next }) => {
  // The server-side client may already have resolved the caller.
  if (context.principal) {
    return next({ context: { principal: context.principal } });
  }

  const session = await getSession();
  if (!session) {
    throw new ORPCError("UNAUTHORIZED");
  }

  const principal = await resolvePrincipal(context.db, session);
  return next({ context: { principal } });
});

/** 20 requests per minute per user, counted in memory. */
const limiter = new MemoryRateLimiter({ maxRequests: 20, window: 60_000 });

export const rateLimit = ratelimit<AuthedContext, unknown>({
  limiter,
  key: ({ context }) => `user:${context.principal.user.id}`,
});

/** The builder every procedure uses: error boundary → auth → rate limit → handler. */
export const authed = implementer.use(errorBoundary).use(requireAuth).use(rateLimit);
