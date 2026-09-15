import type { Prisma } from "@/lib/db/generated/client";

/**
 * Query shapes shared by services and DTO mappers. Keeping the `select`/
 * `include` fragments here guarantees that mappers receive exactly the fields
 * they need, and no more.
 */

export const userSummarySelect = {
  id: true,
  name: true,
  email: true,
  avatarUrl: true,
} satisfies Prisma.UserSelect;

export type UserSummaryRow = Prisma.UserGetPayload<{ select: typeof userSummarySelect }>;

export const projectInclude = {
  lead: { select: userSummarySelect },
  createdBy: { select: userSummarySelect },
  _count: { select: { issues: true } },
} satisfies Prisma.ProjectInclude;

export type ProjectRow = Prisma.ProjectGetPayload<{ include: typeof projectInclude }>;

export const issueInclude = {
  project: { select: { id: true, key: true, name: true } },
  assignee: { select: userSummarySelect },
  createdBy: { select: userSummarySelect },
  _count: { select: { comments: true } },
} satisfies Prisma.IssueInclude;

export type IssueRow = Prisma.IssueGetPayload<{ include: typeof issueInclude }>;

export const commentInclude = {
  author: { select: userSummarySelect },
} satisfies Prisma.CommentInclude;

export type CommentRow = Prisma.CommentGetPayload<{ include: typeof commentInclude }>;

export const membershipInclude = {
  user: { select: userSummarySelect },
} satisfies Prisma.OrganizationMembershipInclude;

export type MembershipRow = Prisma.OrganizationMembershipGetPayload<{ include: typeof membershipInclude }>;

export function parseRoleKeys(raw: string): string[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((key): key is string => typeof key === "string") : [];
  } catch {
    return [];
  }
}
