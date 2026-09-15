import { ORPCError } from "@orpc/server";
import type { ListMembersQuery, UpdateOrganizationInput } from "@/lib/api/schemas/organizations";
import { assertOrganizationAdmin } from "@/lib/auth/policies";
import type { Principal } from "@/lib/auth/principal";
import type { PrismaClient } from "@/lib/db/client";
import type { Organization, Prisma } from "@/lib/db/generated/client";
import { buildPage, decodeCursor, keysetWhere, type Page } from "@/lib/domain/pagination";
import { membershipInclude, type MembershipRow } from "@/lib/services/shared";

export async function updateOrganization(
  db: PrismaClient,
  principal: Principal,
  input: UpdateOrganizationInput,
): Promise<Organization> {
  assertOrganizationAdmin(principal, "rename the organization");
  return db.organization.update({
    where: { id: principal.organization.id },
    data: { name: input.name },
  });
}

export async function listMembers(db: PrismaClient, principal: Principal, query: ListMembersQuery): Promise<Page<MembershipRow>> {
  const where: Prisma.OrganizationMembershipWhereInput = {
    organizationId: principal.organization.id,
    ...(query.search
      ? { user: { OR: [{ name: { contains: query.search } }, { email: { contains: query.search } }] } }
      : {}),
    ...(query.cursor ? keysetWhere("createdAt", "asc", decodeCursor(query.cursor), "date") : {}),
  };

  const rows = await db.organizationMembership.findMany({
    where,
    include: membershipInclude,
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    take: query.limit + 1,
  });

  return buildPage(rows, query.limit, (row) => ({ v: row.createdAt.toISOString(), id: row.id }));
}

export async function getMember(db: PrismaClient, principal: Principal, userId: string): Promise<MembershipRow> {
  const membership = await db.organizationMembership.findUnique({
    where: { organizationId_userId: { organizationId: principal.organization.id, userId } },
    include: membershipInclude,
  });
  if (!membership) {
    throw new ORPCError("NOT_FOUND", { message: "Member not found", data: { resource: "member", id: userId } });
  }
  return membership;
}
