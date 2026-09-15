import { implementer } from "@/lib/api/server/orpc";
import { commentsRouter } from "@/lib/api/server/procedures/comments";
import { issuesRouter } from "@/lib/api/server/procedures/issues";
import { organizationsRouter, viewerRouter } from "@/lib/api/server/procedures/organizations";
import { projectsRouter } from "@/lib/api/server/procedures/projects";

/**
 * The implemented router. Its shape is verified against the contract at
 * compile time: a missing or mistyped procedure is a TypeScript error.
 */
export const router = implementer.router({
  viewer: viewerRouter,
  organizations: organizationsRouter,
  projects: projectsRouter,
  issues: issuesRouter,
  comments: commentsRouter,
});

export type ApiRouter = typeof router;
