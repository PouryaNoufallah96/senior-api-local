import { OpenAPIGenerator } from "@orpc/openapi";
import { ZodToJsonSchemaConverter } from "@orpc/zod";
import { contract } from "@/lib/api/contract";
import { API_ERROR_STATUS_MAP } from "@/lib/api/errors";

export const API_VERSION_PREFIX = "/api/v1";

const generator = new OpenAPIGenerator({
  converters: [new ZodToJsonSchemaConverter()],
});

/**
 * Generates the OpenAPI document from the contract. Paths, parameters,
 * request/response schemas and error responses all come from the contract;
 * only the document-level metadata lives here.
 */
export function generateOpenAPIDocument() {
  return generator.generate(contract, {
    errorStatusMap: API_ERROR_STATUS_MAP,
    base: {
      info: {
        title: "Issue Tracker API",
        version: "1.0.0",
        description:
          "Resource-oriented API for organizations, projects, issues and comments. All operations are scoped to the caller's active organization; authentication uses the Kinde session cookie issued by the web app. List endpoints use cursor pagination (`limit`, `cursor`) and return `{ data, pageInfo: { nextCursor, hasMore } }`.",
      },
      servers: [{ url: API_VERSION_PREFIX }],
      tags: [
        { name: "Organization", description: "The caller's identity and active organization" },
        { name: "Projects", description: "Projects group issues and carry a short key used in issue identifiers" },
        { name: "Issues", description: "Work items within a project" },
        { name: "Comments", description: "Discussion on issues" },
      ],
      components: {
        securitySchemes: {
          kindeSession: {
            type: "apiKey",
            in: "cookie",
            name: "access_token",
            description: "Kinde session cookie set by the web application's login flow.",
          },
        },
      },
      security: [{ kindeSession: [] }],
    },
  });
}
