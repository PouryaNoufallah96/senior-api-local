import { ORPCError } from "@orpc/server";
import type { CreateCommentInput, ListCommentsQuery, UpdateCommentInput } from "@/lib/api/schemas/comments";
import { assertCanEditComment } from "@/lib/auth/policies";
import type { Principal } from "@/lib/auth/principal";
import type { PrismaClient } from "@/lib/db/client";
import type { Prisma } from "@/lib/db/generated/client";
import { buildPage, decodeCursor, keysetWhere, type Page } from "@/lib/domain/pagination";
import { commentInclude, type CommentRow } from "@/lib/services/shared";

export async function listComments(
  db: PrismaClient,
  principal: Principal,
  issueId: string,
  query: ListCommentsQuery,
): Promise<Page<CommentRow>> {
  const organizationId = principal.organization.id;
  await assertIssueExists(db, organizationId, issueId);

  const where: Prisma.CommentWhereInput = {
    organizationId,
    issueId,
    ...(query.cursor ? keysetWhere("createdAt", query.sortOrder, decodeCursor(query.cursor), "date") : {}),
  };

  const rows = await db.comment.findMany({
    where,
    include: commentInclude,
    orderBy: [{ createdAt: query.sortOrder }, { id: query.sortOrder }],
    take: query.limit + 1,
  });

  return buildPage(rows, query.limit, (row) => ({ v: row.createdAt.toISOString(), id: row.id }));
}

export async function getComment(db: PrismaClient, principal: Principal, commentId: string): Promise<CommentRow> {
  const comment = await db.comment.findFirst({
    where: { id: commentId, organizationId: principal.organization.id },
    include: commentInclude,
  });
  if (!comment) {
    throw new ORPCError("NOT_FOUND", { message: "Comment not found", data: { resource: "comment", id: commentId } });
  }
  return comment;
}

export async function createComment(
  db: PrismaClient,
  principal: Principal,
  issueId: string,
  input: CreateCommentInput,
): Promise<CommentRow> {
  const organizationId = principal.organization.id;
  await assertIssueExists(db, organizationId, issueId);

  return db.comment.create({
    data: { organizationId, issueId, authorId: principal.user.id, body: input.body },
    include: commentInclude,
  });
}

export async function updateComment(
  db: PrismaClient,
  principal: Principal,
  commentId: string,
  input: UpdateCommentInput,
): Promise<CommentRow> {
  const existing = await getComment(db, principal, commentId);
  assertCanEditComment(principal, existing);

  return db.comment.update({
    where: { id: existing.id },
    data: { body: input.body, editedAt: new Date() },
    include: commentInclude,
  });
}

export async function deleteComment(db: PrismaClient, principal: Principal, commentId: string): Promise<void> {
  const existing = await getComment(db, principal, commentId);
  assertCanEditComment(principal, existing);

  await db.comment.delete({ where: { id: existing.id } });
}

async function assertIssueExists(db: PrismaClient, organizationId: string, issueId: string): Promise<void> {
  const issue = await db.issue.findFirst({ where: { id: issueId, organizationId }, select: { id: true } });
  if (!issue) throw new ORPCError("NOT_FOUND", { message: "Issue not found", data: { resource: "issue", id: issueId } });
}
