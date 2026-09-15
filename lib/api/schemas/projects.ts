import * as z from "zod";
import { PaginationQuerySchema, paginatedSchema } from "@/lib/api/schemas/common";
import { UserSummarySchema } from "@/lib/api/schemas/users";

export const ProjectStatusSchema = z.enum(["ACTIVE", "ARCHIVED"]);
export type ProjectStatus = z.infer<typeof ProjectStatusSchema>;

export const ProjectSchema = z
  .object({
    id: z.string(),
    /** Short uppercase key used as the issue prefix, e.g. ENG in ENG-42. */
    key: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    status: ProjectStatusSchema,
    lead: UserSummarySchema.nullable(),
    createdBy: UserSummarySchema,
    issueCount: z.number().int(),
    archivedAt: z.iso.datetime().nullable(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .meta({ id: "Project" });
export type ProjectDTO = z.infer<typeof ProjectSchema>;

export const CreateProjectInputSchema = z.object({
  key: z.string().trim().toUpperCase().min(2).max(10),
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(5_000).nullable().optional(),
  leadId: z.string().nullable().optional(),
});
export type CreateProjectInput = z.infer<typeof CreateProjectInputSchema>;

/** Fields a client may change. Everything else is server-owned. */
export const UpdateProjectInputSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  description: z.string().trim().max(5_000).nullable().optional(),
  status: ProjectStatusSchema.optional(),
  leadId: z.string().nullable().optional(),
});
export type UpdateProjectInput = z.infer<typeof UpdateProjectInputSchema>;

export const ListProjectsQuerySchema = PaginationQuerySchema.extend({
  /** Defaults to ACTIVE projects only. */
  status: ProjectStatusSchema.optional(),
  search: z.string().trim().min(1).max(100).optional(),
  sortBy: z.enum(["createdAt", "updatedAt", "name"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});
export type ListProjectsQuery = z.infer<typeof ListProjectsQuerySchema>;

export const ProjectListSchema = paginatedSchema(ProjectSchema);
