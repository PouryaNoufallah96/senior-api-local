import { ORPCError } from "@orpc/server";
import type { AuthSession } from "@/lib/auth/kinde";
import type { Principal } from "@/lib/auth/principal";
import { isOrganizationAdmin } from "@/lib/auth/roles";
import type { PrismaClient } from "@/lib/db/client";
import type { Prisma } from "@/lib/db/generated/client";

/**
 * Maps a verified Kinde session onto our own user, organization and
 * membership rows (creating or refreshing them). Everything comes from the
 * verified token, never from client input. A session without an active
 * organization cannot access tenant data.
 */
export async function resolvePrincipal(db: PrismaClient, session: AuthSession): Promise<Principal> {
  if (!session.organization) {
    throw new ORPCError("NO_ACTIVE_ORGANIZATION");
  }

  const roles = [...new Set(session.roles)].sort();

  const [user, organization] = await Promise.all([
    db.user.upsert({
      where: { kindeUserId: session.user.kindeUserId },
      create: {
        kindeUserId: session.user.kindeUserId,
        email: session.user.email,
        name: session.user.name,
        avatarUrl: session.user.picture,
      },
      update: {
        email: session.user.email,
        name: session.user.name,
        avatarUrl: session.user.picture,
      },
    }),
    db.organization.upsert({
      where: { kindeOrgCode: session.organization.code },
      create: {
        kindeOrgCode: session.organization.code,
        name: session.organization.name ?? session.organization.code,
      },
      // Organization names are editable in-app, so only take Kinde's name on create.
      update: {},
    }),
  ]);

  await db.organizationMembership.upsert({
    where: { organizationId_userId: { organizationId: organization.id, userId: user.id } },
    create: { organizationId: organization.id, userId: user.id, roleKeys: JSON.stringify(roles) },
    update: { roleKeys: JSON.stringify(roles), lastSeenAt: new Date() },
  });

  return {
    user,
    organization,
    roles,
    permissions: session.permissions,
    isAdmin: isOrganizationAdmin(roles),
  };
}

/** Verifies that `userId` belongs to the organization. Works inside transactions too. */
export async function isOrganizationMember(
  db: PrismaClient | Prisma.TransactionClient,
  organizationId: string,
  userId: string,
): Promise<boolean> {
  const membership = await db.organizationMembership.findUnique({
    where: { organizationId_userId: { organizationId, userId } },
    select: { id: true },
  });
  return membership !== null;
}
