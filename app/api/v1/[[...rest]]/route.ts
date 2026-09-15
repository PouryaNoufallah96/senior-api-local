import { API_VERSION_PREFIX, openApiHandler } from "@/lib/api/server/handlers";
import { createContext } from "@/lib/api/server/orpc";

/**
 * Versioned REST transport (`/api/v1/...`), the API reference at
 * `/api/v1/docs` and the specification at `/api/v1/openapi.json`.
 */
async function handleRequest(request: Request): Promise<Response> {
  const { response } = await openApiHandler.handle(request, { prefix: API_VERSION_PREFIX, context: createContext() });
  return response ?? Response.json({ code: "NOT_FOUND", message: "No route matches this path" }, { status: 404 });
}

export const HEAD = handleRequest;
export const GET = handleRequest;
export const POST = handleRequest;
export const PUT = handleRequest;
export const PATCH = handleRequest;
export const DELETE = handleRequest;
