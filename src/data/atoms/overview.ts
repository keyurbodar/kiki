import { Atom } from "effect/reactivity";
import type { OrgId } from "../api/schemas/ids.ts";
import { ApiClient } from "../client/ApiClient.ts";
import { queryTimeToLive } from "./conventions.ts";

const threadKey = (orgId: OrgId, jamId: string) => `${orgId}/${jamId}`;
const parseThreadKey = (key: string) => key.split("/") as [OrgId, string];

const childrenQuery = Atom.family((key: string) => {
  const [orgId, jamId] = parseThreadKey(key);
  return ApiClient.query("children", "list", {
    params: { orgId, jamId },
    reactivityKeys: [`children:${key}`],
    timeToLive: queryTimeToLive,
  });
});

export const overviewChildrenAtom = (orgId: OrgId, jamId: string) =>
  childrenQuery(threadKey(orgId, jamId));

const pullsQuery = Atom.family((key: string) => {
  const [orgId, jamId] = parseThreadKey(key);
  return ApiClient.query("pulls", "forThread", {
    params: { orgId, jamId },
    reactivityKeys: [`pulls:${key}`],
    timeToLive: queryTimeToLive,
  });
});

export const overviewPullsAtom = (orgId: OrgId, jamId: string) =>
  pullsQuery(threadKey(orgId, jamId));

const localPullsQuery = Atom.family((key: string) => {
  const [orgId, jamId] = parseThreadKey(key);
  return ApiClient.query("pulls", "localPullsForThread", {
    params: { orgId, jamId },
    reactivityKeys: [`local-pulls:${key}`],
    timeToLive: queryTimeToLive,
  });
});

export const overviewLocalPullsAtom = (orgId: OrgId, jamId: string) =>
  localPullsQuery(threadKey(orgId, jamId));

export const overviewRemoveLocalPullAtom = ApiClient.mutation(
  "pulls",
  "removeLocalPull",
);
