import * as z from "zod";
import { PaginationQuerySchema, paginatedSchema } from "@/lib/api/schemas/common";
import { UserSummarySchema } from "@/lib/api/schemas/users";

export const OrganizationSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .meta({ id: "Organization" });
export type OrganizationDTO = z.infer<typeof OrganizationSchema>;

export const UpdateOrganizationInputSchema = z.object({
  name: z.string().trim().min(1).max(100),
});
export type UpdateOrganizationInput = z.infer<typeof UpdateOrganizationInputSchema>;

/** A member of the caller's organization. */
export const MemberSchema = z
  .object({
    user: UserSummarySchema,
    /** Kinde role keys from the member's most recent session. */
    roles: z.array(z.string()),
    isAdmin: z.boolean(),
    joinedAt: z.iso.datetime(),
    lastSeenAt: z.iso.datetime(),
  })
  .meta({ id: "Member" });
export type MemberDTO = z.infer<typeof MemberSchema>;

export const ListMembersQuerySchema = PaginationQuerySchema.extend({
  search: z.string().trim().min(1).max(100).optional(),
});
export type ListMembersQuery = z.infer<typeof ListMembersQuerySchema>;

export const MemberListSchema = paginatedSchema(MemberSchema);

/** The caller's own identity and organization. */
export const ViewerSchema = z
  .object({
    user: UserSummarySchema,
    organization: OrganizationSchema,
    roles: z.array(z.string()),
    isAdmin: z.boolean(),
  })
  .meta({ id: "Viewer" });
export type ViewerDTO = z.infer<typeof ViewerSchema>;
