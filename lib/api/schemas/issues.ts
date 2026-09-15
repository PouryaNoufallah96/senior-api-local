import * as z from "zod";
import { PaginationQuerySchema, paginatedSchema } from "@/lib/api/schemas/common";
import { UserSummarySchema } from "@/lib/api/schemas/users";

export const IssueStatusSchema = z.enum(["BACKLOG", "TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "CANCELED"]);
export type IssueStatus = z.infer<typeof IssueStatusSchema>;

export const IssuePrioritySchema = z.enum(["NONE", "URGENT", "HIGH", "MEDIUM", "LOW"]);
export type IssuePriority = z.infer<typeof IssuePrioritySchema>;

export const IssueSchema = z
  .object({
    id: z.string(),
    /** Human-readable identifier, e.g. ENG-42. */
    identifier: z.string(),
    number: z.number().int(),
    title: z.string(),
    description: z.string().nullable(),
    status: IssueStatusSchema,
    priority: IssuePrioritySchema,
    project: z.object({
      id: z.string(),
      key: z.string(),
      name: z.string(),
    }),
    assignee: UserSummarySchema.nullable(),
    createdBy: UserSummarySchema,
    dueDate: z.iso.datetime().nullable(),
    commentCount: z.number().int(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .meta({ id: "Issue" });
export type IssueDTO = z.infer<typeof IssueSchema>;

export const CreateIssueInputSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(20_000).nullable().optional(),
  status: IssueStatusSchema.default("BACKLOG"),
  priority: IssuePrioritySchema.default("NONE"),
  assigneeId: z.string().nullable().optional(),
  dueDate: z.iso.datetime().nullable().optional(),
});
export type CreateIssueInput = z.infer<typeof CreateIssueInputSchema>;

/** Fields a client may change. Everything else is server-owned. */
export const UpdateIssueInputSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(20_000).nullable().optional(),
  status: IssueStatusSchema.optional(),
  priority: IssuePrioritySchema.optional(),
  assigneeId: z.string().nullable().optional(),
  dueDate: z.iso.datetime().nullable().optional(),
});
export type UpdateIssueInput = z.infer<typeof UpdateIssueInputSchema>;

export const AssignIssueInputSchema = z.object({
  /** Member to assign, or null to unassign. */
  assigneeId: z.string().nullable(),
});
export type AssignIssueInput = z.infer<typeof AssignIssueInputSchema>;

/** Filters, sorting and pagination for GET /issues and GET /projects/{projectId}/issues. */
export const ListIssuesQuerySchema = PaginationQuerySchema.extend({
  projectId: z.string().optional(),
  status: IssueStatusSchema.optional(),
  priority: IssuePrioritySchema.optional(),
  /** A member id, or `unassigned`. */
  assigneeId: z.string().optional(),
  createdById: z.string().optional(),
  /** Substring match on the title. */
  search: z.string().trim().min(1).max(200).optional(),
  sortBy: z.enum(["createdAt", "updatedAt"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});
export type ListIssuesQuery = z.infer<typeof ListIssuesQuerySchema>;

export const IssueListSchema = paginatedSchema(IssueSchema);
