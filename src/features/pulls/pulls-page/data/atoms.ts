import { AsyncResult, Atom } from "effect/reactivity";
import { queryTimeToLive } from "@/data/atoms/conventions";
import { ApiClient } from "@/data/client/ApiClient";
import { decodePullPage, type PullCard, type PullPage } from "./pull";

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
  const { orgId, request, cursor } = JSON.parse(key) as {
    orgId: string;
    request: PullListRequest;
    cursor: string | null;
  };
  const page = ApiClient.query("pulls", "list", {
    params: { orgId },
    query: {
      ...toListQuery(request),
      ...(cursor === null ? {} : { cursor }),
    },
    reactivityKeys: [pullsReactivityKey(orgId)],
    timeToLive: queryTimeToLive,
  });
  // The response is undecoded and every row carries the pull's body, which no
  // list surface reads. Decoding here means the cache holds the projection a
  // row renders rather than the record the API happens to return.
  return Atom.map(page, (result) => AsyncResult.map(result, decodePullPage));
});

export const pullsAtom = (
  orgId: string,
  request: PullListRequest,
  cursor: string | null = null,
) => pullsQuery(JSON.stringify({ orgId, request, cursor }));

/** How many pages one list request follows; Capy pages at 50 and shows every page. */
export const maxPullPages = 20;

/**
 * Every page of a list request, following `cursor` to the end. Client-side
 * filtering has to see all of them, so the list is not truncated to one page.
 */
const pullsPagesQuery = Atom.family((key: string) => {
  const { orgId, request } = JSON.parse(key) as {
    orgId: string;
    request: PullListRequest;
  };
  return Atom.make((get) => {
    const items: Array<PullCard> = [];
    let cursor: string | null = null;
    for (let page = 0; page < maxPullPages; page++) {
      const result: AsyncResult.AsyncResult<PullPage, unknown> = get(
        pullsQuery(JSON.stringify({ orgId, request, cursor })),
      );
      if (AsyncResult.isFailure(result))
        return AsyncResult.failure(result.cause);
      if (!AsyncResult.isSuccess(result)) return AsyncResult.initial();
      items.push(...result.value.items);
      cursor = result.value.cursor;
      if (cursor === null || result.value.items.length === 0) break;
    }
    return AsyncResult.success<ReadonlyArray<PullCard>>(items);
  });
});

export const pullsPagesAtom = (orgId: string, request: PullListRequest) =>
  pullsPagesQuery(JSON.stringify({ orgId, request }));

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
