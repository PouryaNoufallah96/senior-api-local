import { toCommentDTO, toIssueDTO } from "@/lib/api/mappers";
import { authed } from "@/lib/api/server/middleware";
import { createComment, listComments } from "@/lib/services/comments";
import { assignIssue, deleteIssue, getIssue, listIssues, updateIssue } from "@/lib/services/issues";

export const issuesRouter = authed.issues.router({
  list: authed.issues.list.handler(async ({ context, input }) => {
    const page = await listIssues(context.db, context.principal, input);
    return { data: page.data.map(toIssueDTO), pageInfo: page.pageInfo };
  }),

  get: authed.issues.get.handler(async ({ context, input }) => {
    const issue = await getIssue(context.db, context.principal, input.issueId);
    return toIssueDTO(issue);
  }),

  update: authed.issues.update.handler(async ({ context, input }) => {
    const { issueId, ...changes } = input;
    const issue = await updateIssue(context.db, context.principal, issueId, changes);
    return toIssueDTO(issue);
  }),

  assign: authed.issues.assign.handler(async ({ context, input }) => {
    const { issueId, ...assignment } = input;
    const issue = await assignIssue(context.db, context.principal, issueId, assignment);
    return toIssueDTO(issue);
  }),

  delete: authed.issues.delete.handler(async ({ context, input }) => {
    await deleteIssue(context.db, context.principal, input.issueId);
  }),

  comments: {
    list: authed.issues.comments.list.handler(async ({ context, input }) => {
      const { issueId, ...query } = input;
      const page = await listComments(context.db, context.principal, issueId, query);
      return { data: page.data.map(toCommentDTO), pageInfo: page.pageInfo };
    }),

    create: authed.issues.comments.create.handler(async ({ context, input }) => {
        const { issueId, ...data } = input;
        const comment = await createComment(context.db, context.principal, issueId, data);
        return toCommentDTO(comment);
      }),
  },
});
