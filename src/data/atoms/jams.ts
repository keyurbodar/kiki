import { Atom } from "effect/reactivity";
import type { JamId, OrgId } from "../api/schemas/ids.ts";
import { ApiClient } from "../client/ApiClient.ts";
import { queryTimeToLive, reactivityKeys } from "./conventions.ts";

export const threadKey = (orgId: OrgId, jamId: JamId) => `${orgId}/${jamId}`;

export const threadAtom = Atom.family((key: string) => {
  const [orgId, jamId] = key.split("/") as [OrgId, JamId];
  return ApiClient.query("jams", "get", {
    params: { orgId, jamId },
    reactivityKeys: [reactivityKeys.threads(orgId)],
    timeToLive: queryTimeToLive,
  });
});

export const threadCountsAtom = Atom.family((orgId: OrgId) =>
  ApiClient.query("jams", "counts", {
    params: { orgId },
    query: {},
    reactivityKeys: [
      reactivityKeys.threads(orgId),
      reactivityKeys.threadOrganization(orgId),
    ],
    timeToLive: queryTimeToLive,
  }),
);

export const archivedThreadsAtom = Atom.family((orgId: OrgId) =>
  ApiClient.query("jams", "list", {
    params: { orgId },
    query: { archived: "only" },
    reactivityKeys: [reactivityKeys.threads(orgId)],
    timeToLive: queryTimeToLive,
  }),
);

export const renameThreadAtom = ApiClient.mutation("jams", "rename");

export const archiveThreadsAtom = ApiClient.mutation("jams", "archive");

export const unarchiveThreadsAtom = ApiClient.mutation("jams", "unarchive");

export const deleteThreadsAtom = ApiClient.mutation("jams", "delete");

export const settleThreadAtom = ApiClient.mutation("jams", "settle");

export const unsettleThreadAtom = ApiClient.mutation("jams", "unsettle");

export const markThreadReadAtom = ApiClient.mutation("jams", "read");

export const markThreadUnreadAtom = ApiClient.mutation("jams", "unread");

export const markAllThreadsReadAtom = ApiClient.mutation("jams", "readAll");

export const regenerateThreadTitleAtom = ApiClient.mutation(
  "jams",
  "regenerateTitle",
);
