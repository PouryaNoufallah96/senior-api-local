import type { CommentDTO } from "@/lib/api/schemas/comments";
import type { IssueDTO, IssuePriority, IssueStatus } from "@/lib/api/schemas/issues";
import type { MemberDTO, OrganizationDTO, ViewerDTO } from "@/lib/api/schemas/organizations";
import type { ProjectDTO, ProjectStatus } from "@/lib/api/schemas/projects";
import type { UserSummaryDTO } from "@/lib/api/schemas/users";
import type { Principal } from "@/lib/auth/principal";
import { isOrganizationAdmin } from "@/lib/auth/roles";
import type { Organization } from "@/lib/db/generated/client";
import {
  parseRoleKeys,
  type CommentRow,
  type IssueRow,
  type MembershipRow,
  type ProjectRow,
  type UserSummaryRow,
} from "@/lib/services/shared";

/**
 * Explicit mapping from persistence rows to public DTOs.
 *
 * The public API model is deliberately decoupled from the database model:
 * internal foreign keys, counters, Kinde identifiers and other implementation
 * details never leave this layer. Output validation in the contract guards
 * against accidental drift.
 */

export function toUserSummary(user: UserSummaryRow): UserSummaryDTO {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
  };
}

export function toOrganizationDTO(organization: Organization): OrganizationDTO {
  return {
    id: organization.id,
    name: organization.name,
    createdAt: organization.createdAt.toISOString(),
    updatedAt: organization.updatedAt.toISOString(),
  };
}

export function toViewerDTO(principal: Principal): ViewerDTO {
  return {
    user: toUserSummary(principal.user),
    organization: toOrganizationDTO(principal.organization),
    roles: [...principal.roles],
    isAdmin: principal.isAdmin,
  };
}

export function toMemberDTO(membership: MembershipRow): MemberDTO {
  const roles = parseRoleKeys(membership.roleKeys);
  return {
    user: toUserSummary(membership.user),
    roles,
    isAdmin: isOrganizationAdmin(roles),
    joinedAt: membership.createdAt.toISOString(),
    lastSeenAt: membership.lastSeenAt.toISOString(),
  };
}

export function toProjectDTO(project: ProjectRow): ProjectDTO {
  return {
    id: project.id,
    key: project.key,
    name: project.name,
    description: project.description,
    // SQLite stores enums as plain strings; the API only ever writes valid values.
    status: project.status as ProjectStatus,
    lead: project.lead ? toUserSummary(project.lead) : null,
    createdBy: toUserSummary(project.createdBy),
    issueCount: project._count.issues,
    archivedAt: project.archivedAt?.toISOString() ?? null,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  };
}

export function toIssueDTO(issue: IssueRow): IssueDTO {
  return {
    id: issue.id,
    identifier: `${issue.project.key}-${issue.number}`,
    number: issue.number,
    title: issue.title,
    description: issue.description,
    status: issue.status as IssueStatus,
    priority: issue.priority as IssuePriority,
    project: { id: issue.project.id, key: issue.project.key, name: issue.project.name },
    assignee: issue.assignee ? toUserSummary(issue.assignee) : null,
    createdBy: toUserSummary(issue.createdBy),
    dueDate: issue.dueDate?.toISOString() ?? null,
    commentCount: issue._count.comments,
    createdAt: issue.createdAt.toISOString(),
    updatedAt: issue.updatedAt.toISOString(),
  };
}

export function toCommentDTO(comment: CommentRow): CommentDTO {
  return {
    id: comment.id,
    issueId: comment.issueId,
    body: comment.body,
    author: toUserSummary(comment.author),
    editedAt: comment.editedAt?.toISOString() ?? null,
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
  };
}
