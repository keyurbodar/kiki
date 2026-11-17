import { DateTime, Effect, Ref } from "effect";
import type { PullRequestId } from "../../api/schemas/ids.ts";
import {
  PullRequestCard,
  PullRequestPage,
  type PullState,
  PullThreadChip,
} from "../../api/schemas/pull.ts";
import { MockDb, newId } from "../db/MockDb.ts";
import { isoMinutesAgo, members } from "../fixtures/world.ts";
import { mockGroup } from "../mockGroup.ts";
import {
  branchesByRepo,
  extraPulls,
  type PullExtras,
  type PullRow,
  projectByRepo,
  threadById,
} from "./fixtures.ts";

const pageSize = 50;

const checksFor = (state: string): PullExtras["checksState"] =>
  state === "failed"
    ? "failed"
    : state === "pending"
      ? "pending"
      : state === "merged" || state === "ready"
        ? "passed"
        : "none";

const date = (iso: string) => DateTime.makeUnsafe(iso);

export const toPullCard = (row: PullRow & PullExtras) => {
  const author = members.find((person) => person.id === row.authorId);
  const login = author?.githubLogin ?? row.authorId;
  const project = projectByRepo.get(row.repo);
  const thread = row.threadId === null ? undefined : threadById.get(row.threadId);
  const threadProject =
    thread?.projectId == null
      ? undefined
      : [...projectByRepo.values()].find((p) => p.id === thread.projectId);
  const updatedAt = date(row.updatedAt);
  return new PullRequestCard({
    id: row.id as PullRequestId,
    projectId: (project?.id ?? null) as PullRequestCard["projectId"],
    repo: row.repo,
    number: row.number,
    title: row.title,
    state: row.state as PullState,
    checksState: row.checksState ?? checksFor(row.state) ?? "none",
    additions: row.additions,
    deletions: row.deletions,
    diffBreakdown: null,
    author: login,
    authorAvatarUrl: "",
    url: `https://github.com/${row.repo}/pull/${row.number}`,
    headRef: row.headRef,
    baseRef: row.baseRef,
    threadId: (thread?.id ?? null) as PullRequestCard["threadId"],
    thread:
      thread === undefined
        ? null
        : new PullThreadChip({
            id: thread.id as PullThreadChip["id"],
            number: thread.number,
            title: thread.title,
            projectCode: threadProject?.code ?? null,
          }),
    jamId: (thread?.id ?? null) as PullRequestCard["jamId"],
    parentId: null,
    stackNumber: null,
    stackPosition: null,
    createdAt:
      row.createdMinutesAgo === undefined
        ? DateTime.subtract(updatedAt, { days: 1 })
        : date(isoMinutesAgo(row.createdMinutesAgo)),
    updatedAt,
  });
};

const newestFirst = (a: PullRequestCard, b: PullRequestCard) =>
  DateTime.toEpochMillis(b.updatedAt) - DateTime.toEpochMillis(a.updatedAt) ||
  (b.id > a.id ? 1 : -1);

const cursorOf = (pull: PullRequestCard) =>
  `${DateTime.toEpochMillis(pull.updatedAt)}:${pull.id}`;

export const PullsMock = mockGroup("pulls", (handlers) =>
  Effect.gen(function* () {
    const { pulls } = yield* MockDb;
    const extras = yield* Ref.make(extraPulls);
    const allCards = Effect.gen(function* () {
      const rows = [...(yield* Ref.get(pulls)), ...(yield* Ref.get(extras))];
      return rows.map(toPullCard).sort(newestFirst);
    });

    return handlers
      .handle("list", ({ params, query }) =>
        Effect.gen(function* () {
          const cards = yield* allCards;
          const term = query.search?.trim().toLowerCase() ?? "";
          const after = query.updatedAfter
            ? Date.parse(query.updatedAfter)
            : undefined;
          const within = <A>(list: ReadonlyArray<A> | undefined, value: A) =>
            list === undefined || list.length === 0 || list.includes(value);
          const outside = <A>(list: ReadonlyArray<A> | undefined, value: A) =>
            list === undefined || !list.includes(value);
          const matching = cards.filter(
            (pull) =>
              params.orgId !== "" &&
              within(query.state, pull.state) &&
              outside(query.excludedState, pull.state) &&
              within(query.repos, pull.repo) &&
              within(query.authors, pull.author) &&
              within(query.projectIds, pull.projectId ?? "") &&
              outside(query.excludedProjectIds, pull.projectId ?? "") &&
              (after === undefined ||
                DateTime.toEpochMillis(pull.updatedAt) > after) &&
              (term === "" ||
                pull.title.toLowerCase().includes(term) ||
                `#${pull.number}`.includes(term) ||
                pull.repo.includes(term)),
          );
          const start =
            query.cursor === undefined
              ? 0
              : matching.findIndex((pull) => cursorOf(pull) === query.cursor) +
                1;
          const limit = Number(query.limit ?? pageSize);
          const items = matching.slice(start, start + limit);
          const last = items.at(-1);
          return new PullRequestPage({
            items,
            cursor:
              last !== undefined && start + limit < matching.length
                ? cursorOf(last)
                : null,
          });
        }),
      )
      .handle("branches", ({ query }) =>
        Effect.succeed(branchesByRepo[query.repo] ?? []),
      )
      .handle("create", ({ payload }) =>
        Effect.gen(function* () {
          const rows = [...(yield* Ref.get(pulls)), ...(yield* Ref.get(extras))];
          const number =
            Math.max(
              0,
              ...rows.filter((row) => row.repo === payload.repo).map((row) => row.number),
            ) + 1;
          const row = {
            id: newId("pr"),
            repo: payload.repo,
            number,
            title: payload.title,
            state: payload.draft === false ? "pending" : "draft",
            authorId: members[0]?.id ?? "",
            headRef: payload.head,
            baseRef: payload.base,
            additions: 0,
            deletions: 0,
            threadId: null,
            updatedAt: isoMinutesAgo(0),
          };
          yield* Ref.update(pulls, (all) => [...all, row]);
          return toPullCard(row);
        }),
      );
  }),
);
