import { Atom } from "effect/reactivity";
import type { OrgId } from "../api/schemas/ids.ts";
import { ApiClient } from "../client/ApiClient.ts";
import { queryTimeToLive } from "./conventions.ts";

/** Reactivity key the guide shares with the pull it belongs to. */
export const pullGuideReactivityKey = (orgId: string, pullId: string) =>
  `pull_guide:${orgId}:${pullId}`;

const pullGuideQuery = Atom.family((key: string) => {
  const { orgId, pullId } = JSON.parse(key) as {
    orgId: OrgId;
    pullId: string;
  };
  return ApiClient.query("pullGuides", "get", {
    params: { orgId, pullId },
    reactivityKeys: [pullGuideReactivityKey(orgId, pullId)],
    timeToLive: queryTimeToLive,
  });
});

/** The guide document the Guide tab renders, cached per pull. */
export const pullGuideAtom = (orgId: string, pullId: string) =>
  pullGuideQuery(JSON.stringify({ orgId, pullId }));
