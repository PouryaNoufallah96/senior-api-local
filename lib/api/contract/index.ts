import { commentsContract } from "@/lib/api/contract/comments";
import { issuesContract } from "@/lib/api/contract/issues";
import { organizationsContract, viewerContract } from "@/lib/api/contract/organizations";
import { projectsContract } from "@/lib/api/contract/projects";

/**
 * The API contract: the single source of truth for procedure names, HTTP
 * routes, input/output schemas and typed errors. The server implements it,
 * the clients are typed from it, the OpenAPI document is generated from it.
 */
export const contract = {
  viewer: viewerContract,
  organizations: organizationsContract,
  projects: projectsContract,
  issues: issuesContract,
  comments: commentsContract,
};

export type ApiContract = typeof contract;
