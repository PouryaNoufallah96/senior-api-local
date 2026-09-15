# API layer

Contract-first oRPC v2 API for organizations, projects, issues and comments. Authentication is Kinde; authorization and tenant isolation live in the app.

## Layout

| Layer | Location | Responsibility |
| --- | --- | --- |
| Contracts | `lib/api/contract/` | Procedure names, HTTP routes (`openapi()` meta), input/output schemas, typed errors. Single source of truth for clients and the OpenAPI document. |
| Schemas / DTOs | `lib/api/schemas/` | Zod schemas for inputs and response DTOs. DTOs never expose Prisma rows. |
| Errors | `lib/api/errors.ts` | One catalogue of every error: code, HTTP status, message, optional `data` shape. Feeds the contract, both handlers and the OpenAPI generator. |
| Server | `lib/api/server/` | Context + implementer (`orpc.ts`), middleware chain (`middleware.ts`), procedures, router, HTTP handlers (`handlers.ts`). |
| Domain / services | `lib/domain/`, `lib/services/` | Business rules, tenant-scoped data access, pagination. |
| Auth | `lib/auth/` | Kinde adapter (`kinde.ts`), `Principal`, admin role mapping, authorization policies. |
| Clients | `lib/api/client/browser.ts`, `lib/api/client/server.ts` | Typed RPC client for the browser; in-process router client for server components. |
| Transport | `app/api/rpc/[[...rest]]/route.ts`, `app/api/v1/[[...rest]]/route.ts` | RPC transport and versioned REST transport + Scalar docs (`/api/v1/docs`, `/api/v1/openapi.json`). |

Request pipeline for every procedure: error boundary → Kinde session → principal (membership mirror upsert) → per-user rate limit → input validation → service → DTO → output validation.

## Authentication and tenancy

- The Kinde session is read per request by `getSession()` in `lib/auth/kinde.ts` (request-scoped via `next/headers`). The context is created per request in `createContext()`; nothing about the caller is stored in module scope.
- The tenant is the access token's `org_code`. Users, organizations and memberships are mirrored into the database from verified claims on each request (`lib/services/identity.ts`). The mirror is what makes assignee/lead validation and member listing possible.
- Organization admin = a Kinde role key of `owner` or `admin` (`lib/auth/roles.ts`). No second RBAC model exists; policies in `lib/auth/policies.ts` combine the admin flag with ownership (creator, lead, author).
- All queries filter by `organizationId`; a foreign resource is indistinguishable from a missing one (`NOT_FOUND`).
- `proxy.ts` marks `/api/rpc` and `/api/v1` as public for Kinde's middleware so API clients receive typed JSON 401/403 instead of login redirects. Consequence: silent token refresh only happens on page requests, not on API calls. If a long-lived SPA session only ever calls the API, the browser client should handle `UNAUTHORIZED` by navigating to `/api/auth/login`.

## Pagination

Cursor-based keyset pagination on `(sortField, id)`; `limit` is 1..100 (default 25). Cursors are opaque base64url payloads; a cursor that cannot be decoded yields `INVALID_CURSOR`.

## Rate limiting

Implemented with `@orpc/ratelimit` (fixed window): one limit of 20 requests per minute per user, applied after authentication (`rateLimit` in `lib/api/server/middleware.ts`). Counters are in-memory, so they are per process and reset on restart.

Responses carry `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset` (and `Retry-After` on 429).

## Errors

Every error is an `ORPCError` with a stable `code`, a safe `message` and optional typed `data`; all codes are defined in `lib/api/errors.ts` and thrown directly from services and policies (`new ORPCError("NOT_FOUND", { data: { resource, id } })`). The error boundary middleware turns input validation failures into `INPUT_VALIDATION_FAILED` (422) with `data.issues[{ path, message }]` and logs unexpected failures before returning a bare `INTERNAL_SERVER_ERROR` (500).

## Versioning

REST routes live under `/api/v1`. Additive changes (new optional fields, new endpoints) do not need a new version; a breaking DTO change would introduce `/api/v2` by mounting a second handler with a second contract. The RPC transport (`/api/rpc`) is consumed only by this app's own bundle and is not versioned.

## Scripts

- `pnpm typecheck`, `pnpm lint`, `pnpm build` (runs `prisma generate` first).
- `pnpm openapi:print` – print the generated OpenAPI document.
- `pnpm db:migrate` – create/apply migrations in development; `pnpm db:deploy` in production.
