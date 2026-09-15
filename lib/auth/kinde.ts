import "server-only";

import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

/** The verified claims we read from the Kinde session cookie. */
export type AuthSession = {
  user: {
    kindeUserId: string;
    email: string | null;
    name: string | null;
    picture: string | null;
  };
  /** The organization the user is currently logged into, if any. */
  organization: { code: string; name: string | null } | null;
  roles: string[];
  permissions: string[];
};

/**
 * Reads the current request's Kinde session. `getKindeServerSession()` uses
 * `next/headers`, so this is request-scoped and safe to call from route
 * handlers and server components. Returns null when nobody is logged in.
 */
export async function getSession(): Promise<AuthSession | null> {
  const session = getKindeServerSession();

  if (!(await session.isAuthenticated())) {
    return null;
  }

  const [user, organization, roles, permissions] = await Promise.all([
    session.getUser(),
    session.getOrganization(),
    session.getRoles(),
    session.getPermissions(),
  ]);

  if (!user) {
    return null;
  }

  const name = [user.given_name, user.family_name].filter(Boolean).join(" ");

  return {
    user: {
      kindeUserId: user.id,
      email: user.email ?? null,
      name: name || user.email || null,
      picture: user.picture ?? null,
    },
    organization: organization?.orgCode ? { code: organization.orgCode, name: organization.orgName ?? null } : null,
    roles: (roles ?? []).map((role) => role.key).filter((key): key is string => typeof key === "string"),
    permissions: permissions?.permissions ?? [],
  };
}
