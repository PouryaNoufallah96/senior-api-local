import { rpcHandler } from "@/lib/api/server/handlers";
import { createContext } from "@/lib/api/server/orpc";

/**
 * RPC transport for the typed browser client (`lib/api/client/browser.ts`).
 * GET is intentionally not exported: cookie-authenticated RPC calls should
 * never be triggerable by a plain link.
 */
async function handleRequest(request: Request): Promise<Response> {
  const { response } = await rpcHandler.handle(request, { prefix: "/api/rpc", context: createContext() });
  return response ?? Response.json({ code: "NOT_FOUND", message: "No route matches this path" }, { status: 404 });
}

export const POST = handleRequest;
export const PUT = handleRequest;
export const PATCH = handleRequest;
export const DELETE = handleRequest;
