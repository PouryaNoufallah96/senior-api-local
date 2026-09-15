import * as z from "zod";

/** Minimal public representation of a user, embedded in other DTOs. */
export const UserSummarySchema = z
  .object({
    id: z.string(),
    name: z.string().nullable(),
    email: z.string().nullable(),
    avatarUrl: z.string().nullable(),
  })
  .meta({ id: "UserSummary" });
export type UserSummaryDTO = z.infer<typeof UserSummarySchema>;
