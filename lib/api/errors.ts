import { COMMON_ERROR_STATUS_MAP } from "@orpc/client";
import * as z from "zod";

/**
 * Every error the API can return, in one place: code, HTTP status, default
 * message and (optionally) the shape of `data`.
 *
 * - The contract declares these so clients get typed errors (`isDefinedError`).
 * - The handlers use the status to build the HTTP response.
 * - Services and procedures throw them with
 *   `new ORPCError("NOT_FOUND", { message, data })`.
 */
export const API_ERRORS = {
  UNAUTHORIZED: {
    status: 401,
    message: "Authentication required",
  },
  FORBIDDEN: {
    status: 403,
    message: "You do not have permission to perform this action",
  },
  NO_ACTIVE_ORGANIZATION: {
    status: 403,
    message: "Your session has no active organization",
  },
  NOT_FOUND: {
    status: 404,
    message: "Resource not found",
    data: z.object({ resource: z.string(), id: z.string() }),
  },
  INPUT_VALIDATION_FAILED: {
    status: 422,
    message: "Input validation failed",
    data: z.object({ issues: z.array(z.object({ path: z.string(), message: z.string() })) }),
  },
  INVALID_CURSOR: {
    status: 400,
    message: "The pagination cursor is invalid",
  },
  PROJECT_ARCHIVED: {
    status: 409,
    message: "Project is archived and cannot be modified",
    data: z.object({ projectId: z.string() }),
  },
  PROJECT_KEY_TAKEN: {
    status: 409,
    message: "A project with this key already exists in this organization",
    data: z.object({ key: z.string() }),
  },
  ASSIGNEE_NOT_MEMBER: {
    status: 422,
    message: "Assignee is not a member of this organization",
    data: z.object({ userId: z.string() }),
  },
  LEAD_NOT_MEMBER: {
    status: 422,
    message: "Project lead is not a member of this organization",
    data: z.object({ userId: z.string() }),
  },
  TOO_MANY_REQUESTS: {
    status: 429,
    message: "Rate limit exceeded",
  },
} as const;

export type ApiErrorCode = keyof typeof API_ERRORS;

/** The same catalogue without `status` (oRPC keeps HTTP statuses out of contracts), for `oc.errors()`. */
export const contractErrors = Object.fromEntries(
  Object.entries(API_ERRORS).map(([code, { status: _status, ...definition }]) => [code, definition]),
) as { [K in ApiErrorCode]: Omit<(typeof API_ERRORS)[K], "status"> };

/**
 * Code → HTTP status, handed to the RPC handler, the OpenAPI handler and the
 * OpenAPI generator. oRPC's own codes (BAD_REQUEST for unparsable bodies,
 * INTERNAL_SERVER_ERROR, ...) keep their standard statuses.
 */
export const API_ERROR_STATUS_MAP: Record<string, number> = {
  ...COMMON_ERROR_STATUS_MAP,
  ...Object.fromEntries(Object.entries(API_ERRORS).map(([code, { status }]) => [code, status])),
};
