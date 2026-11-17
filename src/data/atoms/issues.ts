import { Atom } from "effect/reactivity";
import type { OrgId } from "../api/schemas/ids.ts";
import { ApiClient } from "../client/ApiClient.ts";
import { queryTimeToLive } from "./conventions.ts";

export const issueReactivityKeys = {
  issues: (orgId: string) => `issues:${orgId}`,
  issue: (orgId: string, code: string) => `issue:${orgId}/${code}`,
  states: (orgId: string) => `issue-states:${orgId}`,
  labels: (orgId: string) => `issue-labels:${orgId}`,
} as const;

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
      issueReactivityKeys.issue(orgId, code),
      issueReactivityKeys.issues(orgId),
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
    reactivityKeys: [issueReactivityKeys.states(orgId)],
    timeToLive: queryTimeToLive,
  }),
);

export const issueLabelsAtom = Atom.family((orgId: OrgId) =>
  ApiClient.query("issue-labels", "labels", {
    params: { orgId },
    reactivityKeys: [issueReactivityKeys.labels(orgId)],
    timeToLive: queryTimeToLive,
  }),
);

const issueListQuery = Atom.family((orgId: OrgId) =>
  ApiClient.query("issues", "list", {
    params: { orgId },
    query: {},
    reactivityKeys: [issueReactivityKeys.issues(orgId)],
    timeToLive: queryTimeToLive,
  }),
);

/** Every issue in the org, unfiltered; pickers search it client-side. */
export const allIssuesAtom = (orgId: OrgId) => issueListQuery(orgId);

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
