import { openapi } from "@orpc/openapi";
import * as z from "zod";
import { base } from "@/lib/api/contract/base";
import {
  ListMembersQuerySchema,
  MemberListSchema,
  MemberSchema,
  OrganizationSchema,
  UpdateOrganizationInputSchema,
  ViewerSchema,
} from "@/lib/api/schemas/organizations";

/** The caller's identity within the active organization. */
export const viewerContract = {
  get: base
    .meta(openapi({ method: "GET", path: "/me", tags: ["Organization"], summary: "Get the current user and organization" }))
    .output(ViewerSchema),
};

/**
 * The organization is implied by the caller's Kinde session, so these routes
 * are singular: a client can never address another tenant.
 */
export const organizationsContract = {
  get: base
    .meta(openapi({ method: "GET", path: "/organization", tags: ["Organization"], summary: "Get the active organization" }))
    .output(OrganizationSchema),

  update: base
    .meta(
      openapi({
        method: "PATCH",
        path: "/organization",
        tags: ["Organization"],
        summary: "Rename the active organization",
        description: "Requires an organization admin role.",
      }),
    )
    .input(UpdateOrganizationInputSchema)
    .output(OrganizationSchema),

  members: {
    list: base
      .meta(openapi({ method: "GET", path: "/organization/members", tags: ["Organization"], summary: "List members" }))
      .input(ListMembersQuerySchema)
      .output(MemberListSchema),

    get: base
      .meta(openapi({ method: "GET", path: "/organization/members/{userId}", tags: ["Organization"], summary: "Get a member" }))
      .input(z.object({ userId: z.string() }))
      .output(MemberSchema),
  },
};
