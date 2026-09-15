/**
 * Kinde is the source of truth for roles; we only interpret the role keys
 * carried by the verified session. These two keys grant organization-admin
 * capabilities (renaming the organization, archiving any project, ...).
 */
const ADMIN_ROLE_KEYS = ["owner", "admin"];

export function isOrganizationAdmin(roleKeys: readonly string[]): boolean {
  return roleKeys.some((key) => ADMIN_ROLE_KEYS.includes(key.toLowerCase()));
}
