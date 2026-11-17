import { toast } from "sonner";

/**
 * Capy's bulk runner: runs one request at a time so a shared mutation atom never interrupts
 * an in-flight write, then raises one error toast naming how many failed.
 */
export async function settleBulk(
  requests: ReadonlyArray<() => Promise<unknown>>,
  failure: string,
): Promise<number> {
  let failed = 0;
  for (const request of requests) {
    try {
      await request();
    } catch {
      failed += 1;
    }
  }
  if (failed > 0) {
    toast.error(failure, {
      description: `${failed} of ${requests.length} failed`,
    });
  }
  return failed;
}

export type BulkMember = { readonly id: string; readonly name: string };

/** Reads the members response, which is still undecoded, into id and display name. */
export function toBulkMembers(response: unknown): BulkMember[] {
  const list = Array.isArray(response)
    ? response
    : typeof response === "object" && response !== null
      ? (Object.values(response).find(Array.isArray) ?? [])
      : [];
  return list.flatMap((item: unknown) => {
    if (typeof item !== "object" || item === null) return [];
    const row = item as Record<string, unknown>;
    const user =
      typeof row.user === "object" && row.user !== null
        ? (row.user as Record<string, unknown>)
        : row;
    const id = typeof user.id === "string" ? user.id : undefined;
    if (id === undefined) return [];
    const name =
      typeof user.name === "string"
        ? user.name
        : [user.firstName, user.lastName]
            .filter((part) => typeof part === "string" && part !== "")
            .join(" ") || id;
    return [{ id, name }];
  });
}
