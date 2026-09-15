import { toCommentDTO } from "@/lib/api/mappers";
import { authed } from "@/lib/api/server/middleware";
import { deleteComment, updateComment } from "@/lib/services/comments";

export const commentsRouter = authed.comments.router({
  update: authed.comments.update.handler(async ({ context, input }) => {
    const { commentId, ...changes } = input;
    const comment = await updateComment(context.db, context.principal, commentId, changes);
    return toCommentDTO(comment);
  }),

  delete: authed.comments.delete.handler(async ({ context, input }) => {
    await deleteComment(context.db, context.principal, input.commentId);
  }),
});
