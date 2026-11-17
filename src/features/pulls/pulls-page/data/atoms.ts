import { Atom } from "effect/reactivity";
import type { OrgId } from "../api/schemas/ids.ts";
import type { PullState } from "../api/schemas/pull.ts";
import { ApiClient } from "../client/ApiClient.ts";
import { queryTimeToLive, reactivityKeys } from "./conventions.ts";

/** The server-side part of the /pulls filters, as Capy's `pulls.list` takes it. */
export interface PullListRequest {
  readonly projectIds: ReadonlyArray<string>;
  readonly excludedProjectIds: ReadonlyArray<string>;
  readonly states: ReadonlyArray<PullState>;
  readonly excludedStates: ReadonlyArray<PullState>;
  readonly authors: ReadonlyArray<string>;
  readonly repos: ReadonlyArray<string>;
  readonly labels: ReadonlyArray<string>;
  readonly captainIds: ReadonlyArray<string>;
  readonly updatedAfter: number | null;
  readonly search: string;
  readonly limit: number;
}

const listOrUndefined = <A>(list: ReadonlyArray<A>) =>
  list.length === 0 ? undefined : [...list];

const pullsQuery = Atom.family((key: string) => {
  const { orgId, request } = JSON.parse(key) as {
    orgId: OrgId;
    request: PullListRequest;
  };
  return ApiClient.query("pulls", "list", {
    params: { orgId },
    query: {
      projectIds: listOrUndefined(request.projectIds),
      excludedProjectIds: listOrUndefined(request.excludedProjectIds),
      state: listOrUndefined(request.states),
      excludedState: listOrUndefined(request.excludedStates),
      authors: listOrUndefined(request.authors),
      repos: listOrUndefined(request.repos),
      labels: listOrUndefined(request.labels),
      captainIds: listOrUndefined(request.captainIds),
      updatedAfter:
        request.updatedAfter === null
          ? undefined
          : new Date(request.updatedAfter).toISOString(),
      search: request.search === "" ? undefined : request.search,
      limit: String(request.limit),
    },
    reactivityKeys: [reactivityKeys.pulls(orgId)],
    timeToLive: queryTimeToLive,
  });
});

export const pullsAtom = (orgId: OrgId, request: PullListRequest) =>
  pullsQuery(JSON.stringify({ orgId, request }));

const branchesQuery = Atom.family((key: string) => {
  const [orgId, repo] = key.split("\u0000") as [OrgId, string];
  return ApiClient.query("pulls", "branches", {
    params: { orgId },
    query: { repo },
    timeToLive: "1 minute",
  });
});

export const pullBranchesAtom = (orgId: OrgId, repo: string) =>
  branchesQuery(`${orgId}\u0000${repo}`);

export const installationReposAtom = Atom.family((orgId: OrgId) =>
  ApiClient.query("integrations", "listGitHubInstallationRepos", {
    params: { orgId },
    timeToLive: queryTimeToLive,
  }),
);

export const createPullAtom = ApiClient.mutation("pulls", "create");
