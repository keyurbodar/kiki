import { Atom } from "effect/reactivity";
import type { OrgId } from "../api/schemas/ids.ts";
import { ApiClient } from "../client/ApiClient.ts";
import { queryTimeToLive } from "./conventions.ts";

/**
 * Atoms for the pull view's controls (PR04): checks, labels, reviewers and
 * the merge actions. Keys follow Capy's pull controls, which refetch both the
 * org's pulls and the one pull after every write.
 */
export const pullControlKeys = (orgId: string, pullId: string) => [
  `pull:${orgId}`,
  `pull:${pullId}`,
];

export const pullControlKey = (orgId: OrgId, pullId: string) =>
  `${orgId}/${pullId}`;

const splitKey = (key: string) => {
  const slash = key.indexOf("/");
  return { orgId: key.slice(0, slash), pullId: key.slice(slash + 1) };
};

/** The checks and statuses on a pull's head; keyed by `pullControlKey`. */
export const pullChecksAtom = Atom.family((key: string) => {
  const params = splitKey(key);
  return ApiClient.query("pulls", "checks", {
    params,
    reactivityKeys: pullControlKeys(params.orgId, params.pullId),
    timeToLive: queryTimeToLive,
  });
});

/** The labels a pull can carry; keyed by `pullControlKey`. */
export const pullLabelOptionsAtom = Atom.family((key: string) => {
  const params = splitKey(key);
  return ApiClient.query("pulls", "labels", {
    params,
    reactivityKeys: pullControlKeys(params.orgId, params.pullId),
    timeToLive: queryTimeToLive,
  });
});

/** Requested, suggested and other possible reviewers; keyed by `pullControlKey`. */
export const pullReviewerOptionsAtom = Atom.family((key: string) => {
  const params = splitKey(key);
  return ApiClient.query("pulls", "reviewers", {
    params,
    reactivityKeys: pullControlKeys(params.orgId, params.pullId),
    timeToLive: queryTimeToLive,
  });
});

export const setPullLabelAtom = ApiClient.mutation("pulls", "setLabel");
export const setPullReviewerAtom = ApiClient.mutation("pulls", "setReviewer");
export const mergePullAtom = ApiClient.mutation("pulls", "merge");
export const setPullAutoMergeAtom = ApiClient.mutation("pulls", "setAutoMerge");
export const updatePullBranchAtom = ApiClient.mutation("pulls", "updateBranch");
export const closePullAtom = ApiClient.mutation("pulls", "close");
