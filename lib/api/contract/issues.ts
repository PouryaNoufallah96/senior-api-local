import { openapi } from "@orpc/openapi";
import * as z from "zod";
import { base } from "@/lib/api/contract/base";
import {
  CommentListSchema,
  CommentSchema,
  CreateCommentInputSchema,
  ListCommentsQuerySchema,
} from "@/lib/api/schemas/comments";
import {
  AssignIssueInputSchema,
  IssueListSchema,
  IssueSchema,
  ListIssuesQuerySchema,
  UpdateIssueInputSchema,
} from "@/lib/api/schemas/issues";

export const issuesContract = {
  list: base
    .meta(
      openapi({
        method: "GET",
        path: "/issues",
        tags: ["Issues"],
        summary: "List issues across the organization",
        description: "Filter by `status`, `priority`, `createdById` and `assigneeId` (a member id or `unassigned`).",
      }),
    )
    .input(ListIssuesQuerySchema)
    .output(IssueListSchema),

  get: base
    .meta(openapi({ method: "GET", path: "/issues/{issueId}", tags: ["Issues"], summary: "Get an issue" }))
    .input(z.object({ issueId: z.string() }))
    .output(IssueSchema),

  update: base
    .meta(openapi({ method: "PATCH", path: "/issues/{issueId}", tags: ["Issues"], summary: "Update an issue" }))
    .input(z.object({ issueId: z.string(), ...UpdateIssueInputSchema.shape }))
    .output(IssueSchema),

  assign: base
    .meta(
      openapi({
        method: "PUT",
        path: "/issues/{issueId}/assignee",
        tags: ["Issues"],
        summary: "Set or clear the assignee",
        description: "Pass `assigneeId: null` to unassign.",
      }),
    )
    .input(z.object({ issueId: z.string(), ...AssignIssueInputSchema.shape }))
    .output(IssueSchema),

  delete: base
    .meta(
      openapi({
        method: "DELETE",
        path: "/issues/{issueId}",
        tags: ["Issues"],
        summary: "Delete an issue",
        description: "Deletes the issue and its comments (admin or creator only).",
        successStatus: 204,
      }),
    )
    .input(z.object({ issueId: z.string() }))
    .output(z.void()),

  comments: {
    list: base
      .meta(openapi({ method: "GET", path: "/issues/{issueId}/comments", tags: ["Comments"], summary: "List comments" }))
      .input(z.object({ issueId: z.string(), ...ListCommentsQuerySchema.shape }))
      .output(CommentListSchema),

    create: base
      .meta(openapi({ method: "POST", path: "/issues/{issueId}/comments", tags: ["Comments"], summary: "Comment on an issue", successStatus: 201 }))
      .input(z.object({ issueId: z.string(), ...CreateCommentInputSchema.shape }))
      .output(CommentSchema),
  },
};
