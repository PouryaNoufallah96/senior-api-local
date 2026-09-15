import "server-only";

import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { OpenAPIReferenceHandlerPlugin } from "@orpc/openapi/plugins";
import { RateLimitHandlerPlugin } from "@orpc/ratelimit";
import { RPCHandler } from "@orpc/server/fetch";
import { API_ERROR_STATUS_MAP } from "@/lib/api/errors";
import { API_VERSION_PREFIX, generateOpenAPIDocument } from "@/lib/api/openapi";
import type { ApiContext } from "@/lib/api/server/orpc";
import { router } from "@/lib/api/server/router";

/** Compact RPC transport used by the typed browser client. */
export const rpcHandler = new RPCHandler(router, {
  errorStatusMap: API_ERROR_STATUS_MAP,
  // Adds the RateLimit-* / Retry-After headers set by the rate limit middleware.
  plugins: [new RateLimitHandlerPlugin<ApiContext>()],
});

/** REST transport (`/api/v1/...`) plus the API reference at `/docs` and the spec at `/openapi.json`. */
export const openApiHandler = new OpenAPIHandler(router, {
  errorStatusMap: API_ERROR_STATUS_MAP,
  plugins: [
    new RateLimitHandlerPlugin<ApiContext>(),
    new OpenAPIReferenceHandlerPlugin<ApiContext, "scalar">({
      spec: () => generateOpenAPIDocument(),
      docsPath: "/docs",
      specPath: "/openapi.json",
      docsTitle: "Issue Tracker API",
      provider: "scalar",
      allow: () => process.env.NODE_ENV !== "production" || process.env.API_DOCS_ENABLED === "true",
    }),
  ],
});

export { API_VERSION_PREFIX };
