import { Effect } from "effect";
import { Atom } from "effect/reactivity";
import type { OrgId, ProjectId } from "../api/schemas/ids.ts";
import type { ThreadCard, ThreadCardPage } from "../api/schemas/thread.ts";
import { ApiClient } from "../client/ApiClient.ts";
import { queryTimeToLive, reactivityKeys } from "./conventions.ts";

export const threadListKey = (orgId: OrgId, projectId?: ProjectId) =>
  projectId === undefined ? orgId : `${orgId}/${projectId}`;

const threadsQuery = Atom.family((key: string) => {
  const [orgId, projectId] = key.split("/") as [OrgId, ProjectId | undefined];
  return ApiClient.query("jams", "list", {
    params: { orgId },
    query: projectId === undefined ? {} : { projectIds: [projectId] },
    reactivityKeys: [reactivityKeys.threads(orgId)],
    timeToLive: queryTimeToLive,
  });
});

export const threadsAtom = (orgId: OrgId, projectId?: ProjectId) =>
  threadsQuery(threadListKey(orgId, projectId));

export type AllThreadsOptions = {
  readonly archived: boolean;
  readonly excludeFiled: boolean;
  /** Number of threads per request, not a cap on the total. */
  readonly pageSize?: number;
};

/** The next cursor to request, or null when the page ends the walk. */
export const nextCursor = (
  page: {
    readonly items: ReadonlyArray<unknown>;
    readonly cursor: string | null;
  },
  seen: ReadonlySet<string>,
): string | null =>
  page.cursor === null || page.items.length === 0 || seen.has(page.cursor)
    ? null
    : page.cursor;

/** Every page of the jams list, following the cursor until it runs out. */
export const listAllThreads = (orgId: OrgId, options: AllThreadsOptions) =>
  Effect.gen(function* () {
    const client = yield* ApiClient;
    const items: Array<ThreadCard> = [];
    const seenCursors = new Set<string>();
    let cursor: string | null = null;
    do {
      const page: ThreadCardPage = yield* client.jams.list({
        params: { orgId },
        query: {
          ...(options.archived ? { archived: "only" as const } : {}),
          ...(options.excludeFiled ? { filed: "exclude" as const } : {}),
          ...(options.pageSize === undefined
            ? {}
            : { limit: options.pageSize }),
          ...(cursor === null ? {} : { cursor }),
        },
      });
      items.push(...page.items);
      cursor = nextCursor(page, seenCursors);
      if (cursor !== null) seenCursors.add(cursor);
    } while (cursor !== null);
    return items;
  });

const allThreadsQuery = Atom.family((key: string) => {
  const [orgId, archived, filed] = key.split("|") as [OrgId, string, string];
  return ApiClient.runtime
    .atom(
      listAllThreads(orgId, {
        archived: archived === "archived",
        excludeFiled: filed === "unfiled",
      }),
    )
    .pipe(
      Atom.withReactivity([reactivityKeys.threads(orgId)]),
      Atom.setIdleTTL(queryTimeToLive),
    );
});

export const allThreadsAtom = (
  orgId: OrgId,
  options: { archived: boolean; excludeFiled: boolean },
) =>
  allThreadsQuery(
    [
      orgId,
      options.archived ? "archived" : "active",
      options.excludeFiled ? "unfiled" : "all",
    ].join("|"),
  );
