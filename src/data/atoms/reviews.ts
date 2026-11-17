import { Atom } from "effect/reactivity";
import type { OrgId } from "../api/schemas/ids.ts";
import { ApiClient } from "../client/ApiClient.ts";
import { queryTimeToLive } from "./conventions.ts";

/** Reactivity keys Capy's review settings atoms share with their mutations. */
export const reviewReactivityKeys = {
  settings: (orgId: string) => `review_settings:${orgId}`,
  selfPolicy: (orgId: string) => `review_self_policy:${orgId}`,
  defaults: (orgId: string) => `review_defaults:${orgId}`,
  filterRules: (orgId: string) => `review_filter_rule:${orgId}`,
  ignorePaths: (orgId: string) => `review_ignore_paths:${orgId}`,
  rules: (orgId: string) => `review_rules:${orgId}`,
} as const;

export const reviewSettingsAtom = Atom.family((orgId: OrgId) =>
  ApiClient.query("reviews", "listSettings", {
    params: { orgId },
    reactivityKeys: [reviewReactivityKeys.settings(orgId)],
    timeToLive: queryTimeToLive,
  }),
);
export const configureReviewAtom = ApiClient.mutation("reviews", "configure");

export const selfAuthorPolicyAtom = Atom.family((orgId: OrgId) =>
  ApiClient.query("reviews", "getSelfAuthorPolicy", {
    params: { orgId },
    reactivityKeys: [reviewReactivityKeys.selfPolicy(orgId)],
    timeToLive: queryTimeToLive,
  }),
);
export const setSelfAuthorPolicyAtom = ApiClient.mutation(
  "reviews",
  "setSelfAuthorPolicy",
);

export const reviewDefaultsAtom = Atom.family((orgId: OrgId) =>
  ApiClient.query("reviewDefaultSettings", "getOrg", {
    params: { orgId },
    reactivityKeys: [reviewReactivityKeys.defaults(orgId)],
    timeToLive: queryTimeToLive,
  }),
);
export const setReviewDefaultsAtom = ApiClient.mutation(
  "reviewDefaultSettings",
  "setOrg",
);

export const reviewFilterRulesAtom = Atom.family((orgId: OrgId) =>
  ApiClient.query("reviewFilters", "listRules", {
    params: { orgId },
    reactivityKeys: [reviewReactivityKeys.filterRules(orgId)],
    timeToLive: queryTimeToLive,
  }),
);
export const reviewIgnorePathsAtom = Atom.family((orgId: OrgId) =>
  ApiClient.query("reviewFilters", "listIgnorePaths", {
    params: { orgId },
    reactivityKeys: [reviewReactivityKeys.ignorePaths(orgId)],
    timeToLive: queryTimeToLive,
  }),
);
export const createFilterRuleAtom = ApiClient.mutation(
  "reviewFilters",
  "createRule",
);
export const updateFilterRuleAtom = ApiClient.mutation(
  "reviewFilters",
  "updateRule",
);
export const deleteFilterRuleAtom = ApiClient.mutation(
  "reviewFilters",
  "deleteRule",
);
export const createIgnorePathsAtom = ApiClient.mutation(
  "reviewFilters",
  "createIgnorePaths",
);
export const updateIgnorePathsAtom = ApiClient.mutation(
  "reviewFilters",
  "updateIgnorePaths",
);
export const deleteIgnorePathsAtom = ApiClient.mutation(
  "reviewFilters",
  "deleteIgnorePaths",
);

/** Key for one page of review rules: the org id and the page cursor. */
export const reviewRulesPageKey = (orgId: OrgId, cursor: string) =>
  `${orgId}|${cursor}`;

export const reviewRulesPageAtom = Atom.family((key: string) => {
  const bar = key.indexOf("|");
  const orgId = key.slice(0, bar) as OrgId;
  const cursor = key.slice(bar + 1);
  return ApiClient.query("reviewRules", "list", {
    params: { orgId },
    query: cursor === "" ? {} : { cursor },
    reactivityKeys: [reviewReactivityKeys.rules(orgId)],
    timeToLive: queryTimeToLive,
  });
});
export const createReviewRuleAtom = ApiClient.mutation("reviewRules", "create");
export const updateReviewRuleAtom = ApiClient.mutation("reviewRules", "update");
export const removeReviewRuleAtom = ApiClient.mutation("reviewRules", "remove");

export const setPullGuidesAtom = ApiClient.mutation(
  "organizations",
  "setPullGuides",
);
