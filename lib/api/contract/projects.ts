import { openapi } from "@orpc/openapi";
import * as z from "zod";
import { base } from "@/lib/api/contract/base";
import { CreateIssueInputSchema, IssueListSchema, IssueSchema, ListIssuesQuerySchema } from "@/lib/api/schemas/issues";
import {
  CreateProjectInputSchema,
  ListProjectsQuerySchema,
  ProjectListSchema,
  ProjectSchema,
  UpdateProjectInputSchema,
} from "@/lib/api/schemas/projects";

export const projectsContract = {
  list: base
    .meta(
      openapi({
        method: "GET",
        path: "/projects",
        tags: ["Projects"],
        summary: "List projects",
        description: "Returns active projects by default; pass `status=ARCHIVED` for archived ones.",
      }),
    )
    .input(ListProjectsQuerySchema)
    .output(ProjectListSchema),

  create: base
    .meta(openapi({ method: "POST", path: "/projects", tags: ["Projects"], summary: "Create a project", successStatus: 201 }))
    .input(CreateProjectInputSchema)
    .output(ProjectSchema),

  get: base
    .meta(openapi({ method: "GET", path: "/projects/{projectId}", tags: ["Projects"], summary: "Get a project" }))
    .input(z.object({ projectId: z.string() }))
    .output(ProjectSchema),

  update: base
    .meta(
      openapi({
        method: "PATCH",
        path: "/projects/{projectId}",
        tags: ["Projects"],
        summary: "Update a project",
        description: "Changing `status` archives or restores the project (admin, lead or creator only).",
      }),
    )
    .input(z.object({ projectId: z.string(), ...UpdateProjectInputSchema.shape }))
    .output(ProjectSchema),

  issues: {
    list: base
      .meta(openapi({ method: "GET", path: "/projects/{projectId}/issues", tags: ["Issues"], summary: "List issues in a project" }))
      .input(z.object({ ...ListIssuesQuerySchema.shape, projectId: z.string() }))
      .output(IssueListSchema),

    create: base
      .meta(
        openapi({
          method: "POST",
          path: "/projects/{projectId}/issues",
          tags: ["Issues"],
          summary: "Create an issue in a project",
          description: "The issue number and the creator are assigned by the server.",
          successStatus: 201,
        }),
      )
      .input(z.object({ projectId: z.string(), ...CreateIssueInputSchema.shape }))
      .output(IssueSchema),
  },
};
