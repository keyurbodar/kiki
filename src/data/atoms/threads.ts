import { Atom } from "effect/reactivity";
import type { OrgId, ProjectId } from "../api/schemas/ids.ts";
import { ApiClient } from "../client/ApiClient.ts";
import { queryTimeToLive, reactivityKeys } from "./conventions.ts";

export const threadListKey = (orgId: OrgId, projectId?: ProjectId) =>
  projectId === undefined ? orgId : `${orgId}/${projectId}`;

const threadsQuery = Atom.family((key: string) => {
  const [orgId, projectId] = key.split("/") as [OrgId, ProjectId | undefined];
  return ApiClient.query("jams", "list", {
    params: { orgId },
    query: projectId === undefined ? {} : { projectIds: [projectId] },
    reactivityKeys: [reactivityKeys.threads(orgId)],
    timeToLive: queryTimeToLive,
  });
});

export const threadsAtom = (orgId: OrgId, projectId?: ProjectId) =>
  threadsQuery(threadListKey(orgId, projectId));

export const archivedThreadsAtom = Atom.family((orgId: OrgId) =>
  ApiClient.query("jams", "list", {
    params: { orgId },
    query: { archived: "only" },
    reactivityKeys: [reactivityKeys.threads(orgId)],
    timeToLive: queryTimeToLive,
  }),
);
