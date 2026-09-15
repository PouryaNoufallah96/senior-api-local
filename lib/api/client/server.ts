import "server-only";

import { createRouterClient, type RouterClient } from "@orpc/server";
import { createContext } from "@/lib/api/server/orpc";
import { router } from "@/lib/api/server/router";

/**
 * Server-side client for server components and server actions. Calls run the
 * router in-process (no HTTP round trip) through the exact same middleware
 * chain as HTTP callers. The context is created per call, so every call sees
 * the current request's Kinde cookies.
 */
export const serverApi: RouterClient<typeof router> = createRouterClient(router, {
  context: () => createContext(),
});
