import { Atom } from "effect/reactivity";
import { queryTimeToLive } from "@/data/atoms/conventions";
import { ApiClient } from "@/data/client/ApiClient";

export const pullReactivityKeys = {
  diff: (pullId: string) => `pull_diff:${pullId}`,
  comments: (pullId: string) => `pull_comment:${pullId}`,
  fileViews: (pullId: string) => `pull_file_view:${pullId}`,
} as const;

const split = (key: string) => {
  const index = key.indexOf("/");
  return { orgId: key.slice(0, index), pullId: key.slice(index + 1) };
};

const diffQuery = Atom.family((key: string) => {
  const params = split(key);
  return ApiClient.query("pulls", "diff", {
    params,
    reactivityKeys: [pullReactivityKeys.diff(params.pullId)],
    timeToLive: queryTimeToLive,
  });
});

const reviewQuery = Atom.family((key: string) => {
  const params = split(key);
  return ApiClient.query("pulls", "review", {
    params,
    reactivityKeys: [pullReactivityKeys.comments(params.pullId)],
    timeToLive: queryTimeToLive,
  });
});

const viewedFilesQuery = Atom.family((key: string) => {
  const params = split(key);
  return ApiClient.query("pulls", "viewedFiles", {
    params,
    reactivityKeys: [pullReactivityKeys.fileViews(params.pullId)],
    timeToLive: queryTimeToLive,
  });
});

export const pullDiffAtom = (orgId: string, pullId: string) =>
  diffQuery(`${orgId}/${pullId}`);

export const pullReviewAtom = (orgId: string, pullId: string) =>
  reviewQuery(`${orgId}/${pullId}`);

export const pullViewedFilesAtom = (orgId: string, pullId: string) =>
  viewedFilesQuery(`${orgId}/${pullId}`);

export const updateFindingAtom = ApiClient.mutation("pulls", "updateFinding");

export const setFileViewedAtom = ApiClient.mutation("pulls", "setFileViewed");
