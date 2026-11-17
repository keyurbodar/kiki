import { useAtomValue } from "@effect/atom-react";
import { Option } from "effect";
import { AsyncResult, Atom } from "effect/reactivity";
import { queryTimeToLive } from "@/data/atoms/conventions";
import { ApiClient } from "@/data/client/ApiClient";

/** One side thread of a thread, as the tab menu's Side threads page lists it. */
export type SideThread = { id: string; title: string | null };

export const childrenReactivityKey = (jamId: string) => `jam:${jamId}`;

export const sideThreadsAtom = Atom.family((key: string) => {
  const [orgId = "", jamId = ""] = key.split("/");
  return ApiClient.query("children", "list", {
    params: { orgId, jamId },
    reactivityKeys: [childrenReactivityKey(jamId)],
    timeToLive: queryTimeToLive,
  });
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

/** Maps the undecoded `children.list` rows to side thread menu entries. */
export function toSideThreads(rows: unknown): SideThread[] {
  if (!Array.isArray(rows)) return [];
  return rows.flatMap((row): SideThread[] => {
    if (!isRecord(row) || typeof row.id !== "string") return [];
    const title =
      typeof row.title === "string" && row.title !== "" ? row.title : null;
    return [{ id: row.id, title }];
  });
}

export function useSideThreads(orgId: string, jamId: string) {
  const result = useAtomValue(sideThreadsAtom(`${orgId}/${jamId}`));
  return toSideThreads(Option.getOrUndefined(AsyncResult.value(result)));
}
