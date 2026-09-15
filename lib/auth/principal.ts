import type { Organization, User } from "@/lib/db/generated/client";

/**
 * The fully resolved caller: a verified Kinde identity mapped onto the
 * application's mirrored user + organization rows. Every authenticated
 * procedure receives this via context and every tenant-scoped query is keyed
 * by `principal.organization.id`.
 */
export type Principal = {
  user: User;
  organization: Organization;
  /** Kinde role keys in the active organization. */
  roles: readonly string[];
  /** Kinde permission keys in the active organization. */
  permissions: readonly string[];
  isAdmin: boolean;
};
