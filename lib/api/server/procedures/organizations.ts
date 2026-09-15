import { toMemberDTO, toOrganizationDTO, toViewerDTO } from "@/lib/api/mappers";
import { authed } from "@/lib/api/server/middleware";
import { getMember, listMembers, updateOrganization } from "@/lib/services/organizations";

export const viewerRouter = authed.viewer.router({
  get: authed.viewer.get.handler(({ context }) => toViewerDTO(context.principal)),
});

export const organizationsRouter = authed.organizations.router({
  get: authed.organizations.get.handler(({ context }) => toOrganizationDTO(context.principal.organization)),

  update: authed.organizations.update.handler(async ({ context, input }) => {
    const organization = await updateOrganization(context.db, context.principal, input);
    return toOrganizationDTO(organization);
  }),

  members: {
    list: authed.organizations.members.list.handler(async ({ context, input }) => {
      const page = await listMembers(context.db, context.principal, input);
      return { data: page.data.map(toMemberDTO), pageInfo: page.pageInfo };
    }),

    get: authed.organizations.members.get.handler(async ({ context, input }) => {
      const membership = await getMember(context.db, context.principal, input.userId);
      return toMemberDTO(membership);
    }),
  },
});
