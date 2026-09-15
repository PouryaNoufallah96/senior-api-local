import * as z from "zod";
import { PaginationQuerySchema, paginatedSchema } from "@/lib/api/schemas/common";
import { UserSummarySchema } from "@/lib/api/schemas/users";

export const CommentSchema = z
  .object({
    id: z.string(),
    issueId: z.string(),
    body: z.string(),
    author: UserSummarySchema,
    editedAt: z.iso.datetime().nullable(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .meta({ id: "Comment" });
export type CommentDTO = z.infer<typeof CommentSchema>;

export const CreateCommentInputSchema = z.object({
  body: z.string().trim().min(1).max(20_000),
});
export type CreateCommentInput = z.infer<typeof CreateCommentInputSchema>;

export const UpdateCommentInputSchema = z.object({
  body: z.string().trim().min(1).max(20_000),
});
export type UpdateCommentInput = z.infer<typeof UpdateCommentInputSchema>;

export const ListCommentsQuerySchema = PaginationQuerySchema.extend({
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});
export type ListCommentsQuery = z.infer<typeof ListCommentsQuerySchema>;

export const CommentListSchema = paginatedSchema(CommentSchema);
