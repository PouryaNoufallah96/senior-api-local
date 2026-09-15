import { ORPCError } from "@orpc/server";
import type { Principal } from "@/lib/auth/principal";

/**
 * Authorization: is this (already authenticated) caller allowed to do this?
 *
 * Tenant isolation is enforced structurally: services only ever query rows
 * where `organizationId === principal.organization.id`. The checks below add
 * the role/ownership rules on top. Roles come from Kinde (lib/auth/roles.ts).
 */

function forbidden(message: string): ORPCError<"FORBIDDEN", undefined> {
  return new ORPCError("FORBIDDEN", { message });
}

export function assertOrganizationAdmin(principal: Principal, action: string): void {
  if (!principal.isAdmin) throw forbidden(`Only organization admins can ${action}`);
}

export function assertCanArchiveProject(principal: Principal, project: { createdById: string; leadId: string | null }): void {
  const allowed = principal.isAdmin || project.createdById === principal.user.id || project.leadId === principal.user.id;
  if (!allowed) throw forbidden("Only organization admins, the project lead or the project creator can archive or restore a project");
}

export function assertCanDeleteIssue(principal: Principal, issue: { createdById: string }): void {
  if (!principal.isAdmin && issue.createdById !== principal.user.id) {
    throw forbidden("Only organization admins or the issue creator can delete an issue");
  }
}

export function assertCanEditComment(principal: Principal, comment: { authorId: string }): void {
  if (!principal.isAdmin && comment.authorId !== principal.user.id) {
    throw forbidden("Only the comment author or an organization admin can modify this comment");
  }
}
