import { AsyncResult, Atom } from "effect/reactivity";
import { OrgId } from "@/data/api/schemas/ids.ts";
import { queryTimeToLive } from "@/data/atoms/conventions.ts";
import { ApiClient } from "@/data/client/ApiClient.ts";
import { memoryListQuery, memoryReactivityKey } from "./flow.ts";
import type { MemoryLocation } from "./types.ts";

const orgKey = (orgId: string) => OrgId.make(orgId);

/** A memory topic is one file inside the organization's memory volume. */
export const memoryReadKey = (orgId: string, volumeId: string, path: string) =>
  JSON.stringify([orgId, volumeId, path]);

export const memoryListKey = (
  orgId: string,
  location: MemoryLocation,
  query: string,
  cursor: string | undefined,
) => JSON.stringify([orgId, location, query, cursor ?? null]);

export const memoryListAtom = Atom.family((key: string) => {
  const [orgId, location, query, cursor] = JSON.parse(key) as [
    string,
    MemoryLocation,
    string,
    string | null,
  ];
  return ApiClient.query("memory", "list", {
    params: { orgId: orgKey(orgId) },
    query: memoryListQuery(location, query, cursor ?? undefined),
    reactivityKeys: [memoryReactivityKey(orgId)],
    timeToLive: queryTimeToLive,
  });
});

export const memoryReadAtom = Atom.family((key: string) => {
  const [orgId, volumeId, path] = JSON.parse(key) as [string, string, string];
  return ApiClient.query("memory", "read", {
    params: { orgId: orgKey(orgId), volumeId },
    query: { path },
    reactivityKeys: [memoryReactivityKey(orgId)],
    timeToLive: queryTimeToLive,
  });
});

/** The memory list and read while the org is still resolving. */
export const idleMemoryListAtom: ReturnType<typeof memoryListAtom> = Atom.make(
  AsyncResult.initial(false),
) as ReturnType<typeof memoryListAtom>;

export const idleMemoryReadAtom: ReturnType<typeof memoryReadAtom> = Atom.make(
  AsyncResult.initial(false),
) as ReturnType<typeof memoryReadAtom>;

export const editMemoryAtom = ApiClient.mutation("memory", "edit");
export const forgetMemoryAtom = ApiClient.mutation("memory", "forget");
export const restoreMemoryAtom = ApiClient.mutation("memory", "restore");
