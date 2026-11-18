import { Atom } from "effect/reactivity";
import { queryTimeToLive } from "@/data/atoms/conventions";
import { ApiClient } from "@/data/client/ApiClient";

export const pullReactivityKeys = (orgId: string, pullId: string) => [
  `pull:${orgId}`,
  `pull:${pullId}`,
];

const join = (...parts: ReadonlyArray<string | number>) => parts.join("|");

const split = (key: string) => key.split("|");

const pullByNumberQuery = Atom.family((key: string) => {
  const [orgId = "", repo = "", number = "0"] = split(key);
  return ApiClient.query("pulls", "byNumber", {
    params: { orgId },
    payload: { repo, number: Number(number) },
    reactivityKeys: [`pull:${orgId}`],
    timeToLive: queryTimeToLive,
  });
});

export const pullByNumberAtom = (orgId: string, repo: string, number: number) =>
  pullByNumberQuery(join(orgId, repo, number));

const checksQuery = Atom.family((key: string) => {
  const [orgId = "", pullId = ""] = split(key);
  return ApiClient.query("pulls", "checks", {
    params: { orgId, pullId },
    reactivityKeys: pullReactivityKeys(orgId, pullId),
    timeToLive: queryTimeToLive,
  });
});

export const pullChecksAtom = (orgId: string, pullId: string) =>
  checksQuery(join(orgId, pullId));

const reviewersQuery = Atom.family((key: string) => {
  const [orgId = "", pullId = ""] = split(key);
  return ApiClient.query("pulls", "reviewers", {
    params: { orgId, pullId },
    reactivityKeys: pullReactivityKeys(orgId, pullId),
    timeToLive: queryTimeToLive,
  });
});

export const pullReviewersAtom = (orgId: string, pullId: string) =>
  reviewersQuery(join(orgId, pullId));

const labelsQuery = Atom.family((key: string) => {
  const [orgId = "", pullId = ""] = split(key);
  return ApiClient.query("pulls", "labels", {
    params: { orgId, pullId },
    reactivityKeys: pullReactivityKeys(orgId, pullId),
    timeToLive: queryTimeToLive,
  });
});

export const pullLabelsAtom = (orgId: string, pullId: string) =>
  labelsQuery(join(orgId, pullId));

const threadsQuery = Atom.family((key: string) => {
  const [orgId = "", pullId = ""] = split(key);
  return ApiClient.query("pulls", "threads", {
    params: { orgId, pullId },
    reactivityKeys: pullReactivityKeys(orgId, pullId),
    timeToLive: queryTimeToLive,
  });
});

export const pullThreadsAtom = (orgId: string, pullId: string) =>
  threadsQuery(join(orgId, pullId));

const activityQuery = Atom.family((key: string) => {
  const [orgId = "", pullId = ""] = split(key);
  return ApiClient.query("pulls", "activity", {
    params: { orgId, pullId },
    reactivityKeys: pullReactivityKeys(orgId, pullId),
    timeToLive: queryTimeToLive,
  });
});

export const pullActivityAtom = (orgId: string, pullId: string) =>
  activityQuery(join(orgId, pullId));

const reviewQuery = Atom.family((key: string) => {
  const [orgId = "", pullId = ""] = split(key);
  return ApiClient.query("pulls", "review", {
    params: { orgId, pullId },
    reactivityKeys: pullReactivityKeys(orgId, pullId),
    timeToLive: queryTimeToLive,
  });
});

export const pullReviewAtom = (orgId: string, pullId: string) =>
  reviewQuery(join(orgId, pullId));

const diffQuery = Atom.family((key: string) => {
  const [orgId = "", pullId = ""] = split(key);
  return ApiClient.query("pulls", "diff", {
    params: { orgId, pullId },
    reactivityKeys: pullReactivityKeys(orgId, pullId),
    timeToLive: queryTimeToLive,
  });
});

export const pullDiffAtom = (orgId: string, pullId: string) =>
  diffQuery(join(orgId, pullId));

export const setDraftAtom = ApiClient.mutation("pulls", "setDraft");
export const closePullAtom = ApiClient.mutation("pulls", "close");
export const reopenPullAtom = ApiClient.mutation("pulls", "reopen");
export const mergePullAtom = ApiClient.mutation("pulls", "merge");
export const setAutoMergeAtom = ApiClient.mutation("pulls", "setAutoMerge");
export const updateBranchAtom = ApiClient.mutation("pulls", "updateBranch");
export const editBodyAtom = ApiClient.mutation("pulls", "editBody");
export const unlinkThreadAtom = ApiClient.mutation("pulls", "unlinkThread");
export const setLabelAtom = ApiClient.mutation("pulls", "setLabel");
export const setReviewerAtom = ApiClient.mutation("pulls", "setReviewer");
export const requestReviewAtom = ApiClient.mutation("pulls", "requestReview");
export const commentPullAtom = ApiClient.mutation("pulls", "comment");
export const resolveCommentAtom = ApiClient.mutation("pulls", "resolveComment");
