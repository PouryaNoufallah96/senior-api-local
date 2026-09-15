import { oc } from "@orpc/contract";
import { contractErrors } from "@/lib/api/errors";

/** Every procedure starts from this: all typed errors the API can return are declared once here. */
export const base = oc.errors(contractErrors);
