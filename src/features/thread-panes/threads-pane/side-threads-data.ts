import { useAtomValue } from "@effect/atom-react";
import { Option } from "effect";
import { AsyncResult, Atom } from "effect/reactivity";
import { queryTimeToLive } from "@/data/atoms/conventions";
import { ApiClient } from "@/data/client/ApiClient";
import { untitledThread } from "./match";
import type { SideThreadEntry } from "./side-threads-page";

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
export function toSideThreadEntries(rows: unknown): SideThreadEntry[] {
  if (!Array.isArray(rows)) return [];
  return rows.flatMap((row) => {
    if (!isRecord(row) || typeof row.id !== "string") return [];
    const title =
      typeof row.title === "string" && row.title !== "" ? row.title : null;
    return [{ id: row.id, label: title ?? untitledThread }];
  });
}

export function useSideThreads(orgId: string, jamId: string) {
  const result = useAtomValue(sideThreadsAtom(`${orgId}/${jamId}`));
  return toSideThreadEntries(Option.getOrUndefined(AsyncResult.value(result)));
}
