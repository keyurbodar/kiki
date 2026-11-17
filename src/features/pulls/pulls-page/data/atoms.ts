import { Atom } from "effect/reactivity";
import { queryTimeToLive } from "@/data/atoms/conventions";
import { ApiClient } from "@/data/client/ApiClient";

/** The reactivity key every pulls query and mutation shares. */
export const pullsReactivityKey = (orgId: string) => `pulls:${orgId}`;

/** The server-side part of the /pulls filters, as Capy's `pulls.list` takes it. */
export interface PullListRequest {
  readonly projectIds: ReadonlyArray<string>;
  readonly excludedProjectIds: ReadonlyArray<string>;
  readonly states: ReadonlyArray<string>;
  readonly excludedStates: ReadonlyArray<string>;
  readonly authors: ReadonlyArray<string>;
  readonly repos: ReadonlyArray<string>;
  readonly labels: ReadonlyArray<string>;
  readonly captainIds: ReadonlyArray<string>;
  readonly updatedAfter: number | null;
  readonly search: string;
  readonly limit: number;
}

export const toListQuery = (request: PullListRequest) => {
  const query: Record<string, string | Array<string>> = {
    limit: String(request.limit),
  };
  const lists = {
    projectIds: request.projectIds,
    excludedProjectIds: request.excludedProjectIds,
    state: request.states,
    excludedState: request.excludedStates,
    authors: request.authors,
    repos: request.repos,
    labels: request.labels,
    captainIds: request.captainIds,
  };
  for (const [key, list] of Object.entries(lists)) {
    if (list.length > 0) query[key] = [...list];
  }
  if (request.updatedAfter !== null) {
    query.updatedAfter = new Date(request.updatedAfter).toISOString();
  }
  if (request.search !== "") query.search = request.search;
  return query;
};

const pullsQuery = Atom.family((key: string) => {
  const { orgId, request } = JSON.parse(key) as {
    orgId: string;
    request: PullListRequest;
  };
  return ApiClient.query("pulls", "list", {
    params: { orgId },
    query: toListQuery(request),
    reactivityKeys: [pullsReactivityKey(orgId)],
    timeToLive: queryTimeToLive,
  });
});

export const pullsAtom = (orgId: string, request: PullListRequest) =>
  pullsQuery(JSON.stringify({ orgId, request }));

const branchesQuery = Atom.family((key: string) => {
  const { orgId, repo } = JSON.parse(key) as { orgId: string; repo: string };
  return ApiClient.query("pulls", "branches", {
    params: { orgId },
    query: { repo },
    timeToLive: "1 minute",
  });
});

export const pullBranchesAtom = (orgId: string, repo: string) =>
  branchesQuery(JSON.stringify({ orgId, repo }));

export const installationReposAtom = Atom.family((orgId: string) =>
  ApiClient.query("integrations", "listGitHubInstallationRepos", {
    params: { orgId },
    timeToLive: queryTimeToLive,
  }),
);

export const createPullAtom = ApiClient.mutation("pulls", "create");
