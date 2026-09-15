import { ORPCError } from "@orpc/server";

/**
 * Keyset (cursor) pagination helpers.
 *
 * A cursor encodes the sort value and the id of the last row so pages stay
 * stable while the collection changes. Clients treat it as an opaque string.
 */

export type CursorPayload = {
  /** Sort column value of the last row (ISO timestamp or string). */
  v: string;
  /** Row id of the last row (tie-breaker for stable ordering). */
  id: string;
};

export type SortOrder = "asc" | "desc";

export function encodeCursor(payload: CursorPayload): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

export function decodeCursor(cursor: string): CursorPayload {
  try {
    const parsed: unknown = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"));
    if (typeof parsed === "object" && parsed !== null && "v" in parsed && "id" in parsed) {
      const { v, id } = parsed as CursorPayload;
      if (typeof v === "string" && typeof id === "string") return { v, id };
    }
  } catch {
    // fall through
  }
  throw new ORPCError("INVALID_CURSOR");
}

export type Page<T> = {
  data: T[];
  pageInfo: { nextCursor: string | null; hasMore: boolean };
};

/** Turns `limit + 1` fetched rows into a page; `toCursor` describes the last returned row. */
export function buildPage<TRow>(rows: TRow[], limit: number, toCursor: (row: TRow) => CursorPayload): Page<TRow> {
  const hasMore = rows.length > limit;
  const data = hasMore ? rows.slice(0, limit) : rows;
  const last = data[data.length - 1];
  return {
    data,
    pageInfo: { hasMore, nextCursor: hasMore && last ? encodeCursor(toCursor(last)) : null },
  };
}

/**
 * Prisma `where` fragment that continues after a cursor for a `(sortField, id)`
 * keyset. The sort field is a DateTime (ISO string in the cursor) or a string.
 */
export function keysetWhere(
  field: string,
  order: SortOrder,
  cursor: CursorPayload,
  kind: "date" | "string",
): { OR: Array<Record<string, unknown>> } {
  const value = kind === "date" ? new Date(cursor.v) : cursor.v;
  if (value instanceof Date && Number.isNaN(value.getTime())) throw new ORPCError("INVALID_CURSOR");
  const comparator = order === "desc" ? "lt" : "gt";
  return {
    OR: [
      { [field]: { [comparator]: value } },
      { [field]: value, id: { [comparator]: cursor.id } },
    ],
  };
}
