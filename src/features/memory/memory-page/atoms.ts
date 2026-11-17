import { Atom } from "effect/reactivity";
import { ApiClient } from "@/data/client/ApiClient.ts";
import type { OrgId } from "@/data/api/schemas/ids.ts";
import { queryTimeToLive } from "@/data/atoms/conventions.ts";
import { memoryListQuery, memoryReactivityKey } from "./flow.ts";
import type { MemoryLocation } from "./types.ts";

export const memoryListAtom = Atom.family(
  (orgId: OrgId, location: MemoryLocation, query: string) =>
    ApiClient.query("memory", "list", {
      params: { orgId },
      query: memoryListQuery(location, query),
      reactivityKeys: [memoryReactivityKey(orgId)],
      timeToLive: queryTimeToLive,
    }),
);

export const memoryReadAtom = Atom.family(
  (orgId: OrgId, volumeId: string, path: string) =>
    ApiClient.query("memory", "read", {
      params: { orgId, volumeId },
      query: { path },
      reactivityKeys: [memoryReactivityKey(orgId)],
      timeToLive: queryTimeToLive,
    }),
);

export const editMemoryAtom = ApiClient.mutation("memory", "edit");
export const forgetMemoryAtom = ApiClient.mutation("memory", "forget");
export const restoreMemoryAtom = ApiClient.mutation("memory", "restore");
