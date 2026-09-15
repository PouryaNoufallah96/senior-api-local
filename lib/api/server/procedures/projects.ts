import { toIssueDTO, toProjectDTO } from "@/lib/api/mappers";
import { authed } from "@/lib/api/server/middleware";
import { createIssue, listIssues } from "@/lib/services/issues";
import { createProject, getProject, listProjects, updateProject } from "@/lib/services/projects";

export const projectsRouter = authed.projects.router({
  list: authed.projects.list.handler(async ({ context, input }) => {
    const page = await listProjects(context.db, context.principal, input);
    return { data: page.data.map(toProjectDTO), pageInfo: page.pageInfo };
  }),

  create: authed.projects.create.handler(async ({ context, input }) => {
      const project = await createProject(context.db, context.principal, input);
      return toProjectDTO(project);
    }),

  get: authed.projects.get.handler(async ({ context, input }) => {
    const project = await getProject(context.db, context.principal, input.projectId);
    return toProjectDTO(project);
  }),

  update: authed.projects.update.handler(async ({ context, input }) => {
    const { projectId, ...changes } = input;
    const project = await updateProject(context.db, context.principal, projectId, changes);
    return toProjectDTO(project);
  }),

  issues: {
    list: authed.projects.issues.list.handler(async ({ context, input }) => {
      const page = await listIssues(context.db, context.principal, input);
      return { data: page.data.map(toIssueDTO), pageInfo: page.pageInfo };
    }),

    /**
     * Flagship write endpoint. The chain below runs, in order: error boundary,
     * anonymous IP limit, Kinde session → principal, input validation, write +
     * create rate limits, then the domain service (membership /
     * archive checks, sequential numbering, insert) and finally DTO mapping
     * with output validation against the contract.
     */
    create: authed.projects.issues.create.handler(async ({ context, input }) => {
        const { projectId, ...data } = input;
        const issue = await createIssue(context.db, context.principal, projectId, data);
        return toIssueDTO(issue);
      }),
  },
});
