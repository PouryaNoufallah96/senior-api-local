import { ORPCError } from "@orpc/server";
import type { CreateProjectInput, ListProjectsQuery, UpdateProjectInput } from "@/lib/api/schemas/projects";
import { assertCanArchiveProject } from "@/lib/auth/policies";
import type { Principal } from "@/lib/auth/principal";
import type { PrismaClient } from "@/lib/db/client";
import { Prisma } from "@/lib/db/generated/client";
import { buildPage, decodeCursor, keysetWhere, type Page } from "@/lib/domain/pagination";
import { isOrganizationMember } from "@/lib/services/identity";
import { projectInclude, type ProjectRow } from "@/lib/services/shared";

export async function listProjects(db: PrismaClient, principal: Principal, query: ListProjectsQuery): Promise<Page<ProjectRow>> {
  const sortKind = query.sortBy === "name" ? "string" : "date";
  const where: Prisma.ProjectWhereInput = {
    organizationId: principal.organization.id,
    status: query.status ?? "ACTIVE",
    ...(query.search ? { name: { contains: query.search } } : {}),
    ...(query.cursor ? keysetWhere(query.sortBy, query.sortOrder, decodeCursor(query.cursor), sortKind) : {}),
  };

  const rows = await db.project.findMany({
    where,
    include: projectInclude,
    orderBy: [{ [query.sortBy]: query.sortOrder }, { id: query.sortOrder }],
    take: query.limit + 1,
  });

  return buildPage(rows, query.limit, (row) => ({
    v: query.sortBy === "name" ? row.name : row[query.sortBy].toISOString(),
    id: row.id,
  }));
}

export async function getProject(db: PrismaClient, principal: Principal, projectId: string): Promise<ProjectRow> {
  const project = await db.project.findFirst({
    where: { id: projectId, organizationId: principal.organization.id },
    include: projectInclude,
  });
  if (!project) {
    throw new ORPCError("NOT_FOUND", { message: "Project not found", data: { resource: "project", id: projectId } });
  }
  return project;
}

export async function createProject(db: PrismaClient, principal: Principal, input: CreateProjectInput): Promise<ProjectRow> {
  const organizationId = principal.organization.id;
  await assertLeadIsMember(db, organizationId, input.leadId);

  try {
    return await db.project.create({
      data: {
        organizationId,
        key: input.key,
        name: input.name,
        description: input.description ?? null,
        leadId: input.leadId ?? null,
        createdById: principal.user.id,
      },
      include: projectInclude,
    });
  } catch (error) {
    // P2002 = unique constraint violated; (organizationId, key) is unique in the database.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ORPCError("PROJECT_KEY_TAKEN", { data: { key: input.key } });
    }
    throw error;
  }
}

export async function updateProject(
  db: PrismaClient,
  principal: Principal,
  projectId: string,
  input: UpdateProjectInput,
): Promise<ProjectRow> {
  const existing = await getProject(db, principal, projectId);

  const statusChanges = input.status !== undefined && input.status !== existing.status;
  if (statusChanges) assertCanArchiveProject(principal, existing);

  await assertLeadIsMember(db, principal.organization.id, input.leadId);

  return db.project.update({
    where: { id: existing.id },
    data: {
      name: input.name,
      description: input.description,
      leadId: input.leadId,
      ...(statusChanges ? { status: input.status, archivedAt: input.status === "ARCHIVED" ? new Date() : null } : {}),
    },
    include: projectInclude,
  });
}

async function assertLeadIsMember(db: PrismaClient, organizationId: string, leadId: string | null | undefined): Promise<void> {
  if (leadId && !(await isOrganizationMember(db, organizationId, leadId))) {
    throw new ORPCError("LEAD_NOT_MEMBER", { data: { userId: leadId } });
  }
}
