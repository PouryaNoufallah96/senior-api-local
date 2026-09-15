import * as z from "zod";

/** Query parameters every list endpoint accepts. */
export const PaginationQuerySchema = z.object({
  /** Opaque cursor returned as `pageInfo.nextCursor`. */
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

/** Response envelope every list endpoint returns. */
export function paginatedSchema<T extends z.ZodType>(item: T) {
  return z.object({
    data: z.array(item),
    pageInfo: z.object({
      nextCursor: z.string().nullable(),
      hasMore: z.boolean(),
    }),
  });
}
