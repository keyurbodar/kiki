import { Atom } from "effect/reactivity";
import { ApiClient } from "../client/ApiClient.ts";
import { queryTimeToLive } from "./conventions.ts";

export type OrgActivityQuery = {
  readonly orgId: string;
  readonly from: string;
  readonly to: string;
  readonly timeZone: string;
  readonly project?: ReadonlyArray<string>;
  readonly member?: ReadonlyArray<string>;
  readonly machine?: string;
};

export const activityReactivityKeys = {
  pulls: (orgId: string) => `pull:${orgId}`,
  members: (orgId: string) => `members:${orgId}`,
} as const;

/** Atom families compare keys by reference, so a query is keyed by its JSON. */
export const orgActivityKey = (query: OrgActivityQuery) =>
  JSON.stringify(query);

const toQuery = ({ orgId: _orgId, ...query }: OrgActivityQuery) => {
  const out: Record<string, string | Array<string>> = {
    from: query.from,
    to: query.to,
    timeZone: query.timeZone,
  };
  if (query.project !== undefined) out.project = [...query.project];
  if (query.member !== undefined) out.member = [...query.member];
  if (query.machine !== undefined) out.machine = query.machine;
  return out;
};

export const orgActivityAtom = Atom.family((key: string) => {
  const query = JSON.parse(key) as OrgActivityQuery;
  return ApiClient.query("pulls", "orgActivity", {
    params: { orgId: query.orgId },
    query: toQuery(query),
    reactivityKeys: [activityReactivityKeys.pulls(query.orgId)],
    timeToLive: queryTimeToLive,
  });
});

export const orgHourlyActivityAtom = Atom.family((key: string) => {
  const query = JSON.parse(key) as OrgActivityQuery;
  return ApiClient.query("pulls", "orgHourlyActivity", {
    params: { orgId: query.orgId },
    query: { ...toQuery(query), timezone: query.timeZone },
    timeToLive: queryTimeToLive,
  });
});

export const orgMembersAtom = Atom.family((orgId: string) =>
  ApiClient.query("members", "listMembers", {
    params: { orgId },
    query: {},
    reactivityKeys: [activityReactivityKeys.members(orgId)],
    timeToLive: queryTimeToLive,
  }),
);
