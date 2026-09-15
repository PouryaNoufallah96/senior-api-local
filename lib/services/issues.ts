import { ORPCError } from "@orpc/server";
import type { AssignIssueInput, CreateIssueInput, ListIssuesQuery, UpdateIssueInput } from "@/lib/api/schemas/issues";
import { assertCanDeleteIssue } from "@/lib/auth/policies";
import type { Principal } from "@/lib/auth/principal";
import type { PrismaClient } from "@/lib/db/client";
import type { Prisma } from "@/lib/db/generated/client";
import { buildPage, decodeCursor, keysetWhere, type Page } from "@/lib/domain/pagination";
import { isOrganizationMember } from "@/lib/services/identity";
import { issueInclude, type IssueRow } from "@/lib/services/shared";

export async function listIssues(db: PrismaClient, principal: Principal, query: ListIssuesQuery): Promise<Page<IssueRow>> {
  const organizationId = principal.organization.id;

  if (query.projectId) {
    // A project id from another organization must behave as missing.
    await assertProjectActive(db, organizationId, query.projectId, { allowArchived: true });
  }

  const where: Prisma.IssueWhereInput = {
    organizationId,
    projectId: query.projectId,
    status: query.status,
    priority: query.priority,
    assigneeId: query.assigneeId === "unassigned" ? null : query.assigneeId,
    createdById: query.createdById,
    ...(query.search ? { title: { contains: query.search } } : {}),
    ...(query.cursor ? keysetWhere(query.sortBy, query.sortOrder, decodeCursor(query.cursor), "date") : {}),
  };

  const rows = await db.issue.findMany({
    where,
    include: issueInclude,
    orderBy: [{ [query.sortBy]: query.sortOrder }, { id: query.sortOrder }],
    take: query.limit + 1,
  });

  return buildPage(rows, query.limit, (row) => ({ v: row[query.sortBy].toISOString(), id: row.id }));
}

export async function getIssue(db: PrismaClient, principal: Principal, issueId: string): Promise<IssueRow> {
  const issue = await db.issue.findFirst({
    where: { id: issueId, organizationId: principal.organization.id },
    include: issueInclude,
  });
  if (!issue) throw new ORPCError("NOT_FOUND", { message: "Issue not found", data: { resource: "issue", id: issueId } });
  return issue;
}

export async function createIssue(
  db: PrismaClient,
  principal: Principal,
  projectId: string,
  input: CreateIssueInput,
): Promise<IssueRow> {
  const organizationId = principal.organization.id;

  return db.$transaction(async (tx) => {
    await assertProjectActive(tx, organizationId, projectId);
    await assertAssigneeIsMember(tx, organizationId, input.assigneeId);

    // Allocate the next per-project number atomically inside the transaction.
    const { issueCounter } = await tx.project.update({
      where: { id: projectId },
      data: { issueCounter: { increment: 1 } },
      select: { issueCounter: true },
    });

    return tx.issue.create({
      data: {
        organizationId,
        projectId,
        number: issueCounter,
        title: input.title,
        description: input.description ?? null,
        status: input.status,
        priority: input.priority,
        assigneeId: input.assigneeId ?? null,
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        createdById: principal.user.id,
      },
      include: issueInclude,
    });
  });
}

export async function updateIssue(
  db: PrismaClient,
  principal: Principal,
  issueId: string,
  input: UpdateIssueInput,
): Promise<IssueRow> {
  const organizationId = principal.organization.id;
  const existing = await getIssue(db, principal, issueId);

  await assertProjectActive(db, organizationId, existing.projectId);
  await assertAssigneeIsMember(db, organizationId, input.assigneeId);

  return db.issue.update({
    where: { id: existing.id },
    data: {
      title: input.title,
      description: input.description,
      status: input.status,
      priority: input.priority,
      assigneeId: input.assigneeId,
      dueDate: input.dueDate === undefined ? undefined : input.dueDate ? new Date(input.dueDate) : null,
    },
    include: issueInclude,
  });
}

export async function assignIssue(
  db: PrismaClient,
  principal: Principal,
  issueId: string,
  input: AssignIssueInput,
): Promise<IssueRow> {
  return updateIssue(db, principal, issueId, { assigneeId: input.assigneeId });
}

export async function deleteIssue(db: PrismaClient, principal: Principal, issueId: string): Promise<void> {
  const existing = await getIssue(db, principal, issueId);
  assertCanDeleteIssue(principal, existing);

  // Comments cascade at the database level.
  await db.issue.delete({ where: { id: existing.id } });
}

async function assertProjectActive(
  db: PrismaClient | Prisma.TransactionClient,
  organizationId: string,
  projectId: string,
  options: { allowArchived?: boolean } = {},
): Promise<void> {
  const project = await db.project.findFirst({ where: { id: projectId, organizationId }, select: { status: true } });
  if (!project) {
    throw new ORPCError("NOT_FOUND", { message: "Project not found", data: { resource: "project", id: projectId } });
  }
  if (project.status === "ARCHIVED" && !options.allowArchived) {
    throw new ORPCError("PROJECT_ARCHIVED", { data: { projectId } });
  }
}

async function assertAssigneeIsMember(
  db: PrismaClient | Prisma.TransactionClient,
  organizationId: string,
  assigneeId: string | null | undefined,
): Promise<void> {
  if (assigneeId && !(await isOrganizationMember(db, organizationId, assigneeId))) {
    throw new ORPCError("ASSIGNEE_NOT_MEMBER", { data: { userId: assigneeId } });
  }
}
