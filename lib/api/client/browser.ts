import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { RouterContractClient } from "@orpc/contract";
import type { ApiContract } from "@/lib/api/contract";

export type ApiClient = RouterContractClient<ApiContract>;

/**
 * Browser client for client components. Typed from the contract only, so
 * importing it never pulls server code into the bundle.
 *
 * The relative URL resolves against the current origin, so the same bundle
 * works in development, previews and production, and Kinde's session cookie
 * is sent automatically because the request is same-origin.
 *
 * Server code must use `lib/api/client/server.ts` instead: it calls the router
 * in-process with the current request's session and never goes through HTTP.
 */
const link = new RPCLink({ url: "/api/rpc" });

export const api: ApiClient = createORPCClient(link);
