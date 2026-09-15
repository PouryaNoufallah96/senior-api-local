import { openapi } from "@orpc/openapi";
import * as z from "zod";
import { base } from "@/lib/api/contract/base";
import { CommentSchema, UpdateCommentInputSchema } from "@/lib/api/schemas/comments";

/** Comments are created and listed under their issue (see issuesContract); afterwards they are addressed by id. */
export const commentsContract = {
  update: base
    .meta(
      openapi({
        method: "PATCH",
        path: "/comments/{commentId}",
        tags: ["Comments"],
        summary: "Edit a comment",
        description: "Author or admin only.",
      }),
    )
    .input(z.object({ commentId: z.string(), ...UpdateCommentInputSchema.shape }))
    .output(CommentSchema),

  delete: base
    .meta(
      openapi({
        method: "DELETE",
        path: "/comments/{commentId}",
        tags: ["Comments"],
        summary: "Delete a comment",
        description: "Author or admin only.",
        successStatus: 204,
      }),
    )
    .input(z.object({ commentId: z.string() }))
    .output(z.void()),
};
