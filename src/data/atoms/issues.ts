import { AsyncResult, Atom } from "effect/reactivity";
import type { OrgId } from "../api/schemas/ids.ts";
import { ApiClient } from "../client/ApiClient.ts";
import { queryTimeToLive, reactivityKeys } from "./conventions.ts";

export const issueKey = (orgId: OrgId, code: string) => `${orgId}/${code}`;

const splitKey = (key: string) => {
  const slash = key.indexOf("/");
  return [key.slice(0, slash) as OrgId, key.slice(slash + 1)] as const;
};

const issueQuery = Atom.family((key: string) => {
  const [orgId, code] = splitKey(key);
  return ApiClient.query("issues", "get", {
    params: { orgId, code },
    reactivityKeys: [
      reactivityKeys.issue(orgId, code),
      reactivityKeys.issues(orgId),
    ],
    timeToLive: queryTimeToLive,
  });
});

/** One issue's detail, refetched by any issue mutation that names it. */
export const issueAtom = (orgId: OrgId, code: string) =>
  issueQuery(issueKey(orgId, code));

export const issueStatesAtom = Atom.family((orgId: OrgId) =>
  ApiClient.query("issues", "states", {
    params: { orgId },
    reactivityKeys: [reactivityKeys.issueStates(orgId)],
    timeToLive: queryTimeToLive,
  }),
);

export const issueLabelsAtom = Atom.family((orgId: OrgId) =>
  ApiClient.query("issue-labels", "labels", {
    params: { orgId },
    reactivityKeys: [reactivityKeys.issueLabels(orgId)],
    timeToLive: queryTimeToLive,
  }),
);

const issueListQuery = Atom.family((orgId: OrgId) =>
  ApiClient.query("issues", "list", {
    params: { orgId },
    query: {},
    reactivityKeys: [reactivityKeys.issues(orgId)],
    timeToLive: queryTimeToLive,
  }),
);

/** Every issue in the org, unfiltered; pickers search it client-side. */
export const allIssuesAtom = (orgId: OrgId) => issueListQuery(orgId);

const captainActivityQuery = Atom.family((key: string) => {
  const [orgId, jamId] = splitKey(key);
  return ApiClient.query("issues", "captainActivity", {
    params: { orgId, jamId },
    reactivityKeys: [
      reactivityKeys.issueActivity(orgId, jamId),
      reactivityKeys.issues(orgId),
    ],
    timeToLive: queryTimeToLive,
  });
});

/** The issues a Captain's crew is working on, with the crew's activity on them. */
export const captainIssueActivityAtom = (orgId: OrgId, jamId: string) =>
  captainActivityQuery(`${orgId}/${jamId}`);

/** The org's full issue list while the org is still resolving. */
export const idleAllIssuesAtom: ReturnType<typeof allIssuesAtom> = Atom.make(
  AsyncResult.initial(false),
) as ReturnType<typeof allIssuesAtom>;

export const createIssueAtom = ApiClient.mutation("issues", "create");
export const updateIssueAtom = ApiClient.mutation("issues", "update");
export const linkIssueAtom = ApiClient.mutation("issues", "link");
export const unlinkIssueAtom = ApiClient.mutation("issues", "unlink");
export const relateIssueAtom = ApiClient.mutation("issues", "relate");
export const unrelateIssueAtom = ApiClient.mutation("issues", "unrelate");
export const setIssueSubscriptionAtom = ApiClient.mutation(
  "issues",
  "setSubscription",
);
export const markIssueUnreadAtom = ApiClient.mutation("issues", "markUnread");
export const markIssueSeenAtom = ApiClient.mutation("issues", "markSeen");
