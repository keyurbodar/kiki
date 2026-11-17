import { Effect, Ref } from "effect";
import { fields, MockDb, newId } from "../db/MockDb.ts";
import { isoMinutesAgo, viewer } from "../fixtures/world.ts";
import { mockGroup } from "../mockGroup.ts";
import {
  type FilterRule,
  type IgnorePath,
  sampleIgnorePaths,
  sampleRules,
} from "./fixtures.ts";

type Repo = { readonly id: string; readonly fullName: string };

const text = (value: unknown, fallback: string) =>
  typeof value === "string" && value.length > 0 ? value : fallback;

const flag = (value: unknown, fallback: boolean) =>
  typeof value === "boolean" ? value : fallback;

const stringList = (value: unknown) =>
  Array.isArray(value) ? value.filter((id) => typeof id === "string") : [];

const patterns = (input: Record<string, unknown>) =>
  typeof input.patterns === "string"
    ? [input.patterns]
    : typeof input.path === "string"
      ? [input.path]
      : stringList(input.paths ?? input.patterns);

const withRepoNames = (row: IgnorePath, repos: ReadonlyArray<Repo>) => ({
  ...row,
  repoNames: row.repoIds.map(
    (id) => repos.find((repo) => repo.id === id)?.fullName ?? id,
  ),
});

export const ReviewFiltersMock = mockGroup("reviewFilters", (handlers) =>
  Effect.gen(function* () {
    const { repos } = yield* MockDb;
    const ignorePaths = yield* Ref.make<ReadonlyArray<IgnorePath>>([
      ...sampleIgnorePaths,
    ]);
    const rules = yield* Ref.make<ReadonlyArray<FilterRule>>([...sampleRules]);

    const findIgnorePath = (id: string) =>
      Effect.gen(function* () {
        const rows = yield* Ref.get(ignorePaths);
        const row = rows.find((item) => item.id === id);
        if (!row) {
          return yield* Effect.die(
            new Error(`reviewFilters.ignorePaths: no row ${id}`),
          );
        }
        return row;
      });

    const findRule = (id: string) =>
      Effect.gen(function* () {
        const rows = yield* Ref.get(rules);
        const row = rows.find((item) => item.id === id);
        if (!row) {
          return yield* Effect.die(
            new Error(`reviewFilters.rules: no row ${id}`),
          );
        }
        return row;
      });

    const rowRepos = () => Ref.get(repos);

    return handlers
      .handle("listIgnorePaths", () =>
        Effect.gen(function* () {
          const rows = yield* Ref.get(ignorePaths);
          const allRepos = yield* rowRepos();
          return rows.map((row) => withRepoNames(row, allRepos));
        }),
      )
      .handle("createIgnorePaths", ({ payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const created = patterns(input).map(
            (pattern): IgnorePath => ({
              id: newId("ignore"),
              pattern,
              enabled: flag(input.enabled, true),
              repoIds: stringList(input.repoIds),
              note: text(input.note, "Ignored path"),
              createdAt: isoMinutesAgo(0),
              createdBy: viewer.id,
            }),
          );
          yield* Ref.update(ignorePaths, (rows) => [...rows, ...created]);
          const allRepos = yield* rowRepos();
          return created.map((row) => withRepoNames(row, allRepos));
        }),
      )
      .handle("updateIgnorePaths", ({ params, payload }) =>
        Effect.gen(function* () {
          const current = yield* findIgnorePath(params.id);
          const input = fields(payload);
          const updated = {
            ...current,
            ...(input.pattern === undefined
              ? {}
              : { pattern: text(input.pattern, current.pattern) }),
            ...(input.enabled === undefined
              ? {}
              : { enabled: flag(input.enabled, current.enabled) }),
            ...(input.repoIds === undefined
              ? {}
              : { repoIds: stringList(input.repoIds) }),
            ...(input.note === undefined
              ? {}
              : { note: text(input.note, current.note) }),
          };
          yield* Ref.update(ignorePaths, (rows) =>
            rows.map((row) => (row.id === current.id ? updated : row)),
          );
          const allRepos = yield* rowRepos();
          return withRepoNames(updated, allRepos);
        }),
      )
      .handle("deleteIgnorePaths", ({ params }) =>
        Effect.gen(function* () {
          yield* findIgnorePath(params.id);
          yield* Ref.update(ignorePaths, (rows) =>
            rows.filter((row) => row.id !== params.id),
          );
          return { ok: true, id: params.id };
        }),
      )
      .handle("listRules", () => Ref.get(rules))
      .handle("createRule", ({ payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const rule: FilterRule = {
            id: newId("filter"),
            name: text(input.name, "New filter rule"),
            enabled: flag(input.enabled, true),
            match: text(input.match, "contains") as FilterRule["match"],
            target: text(input.target, "title") as FilterRule["target"],
            value: text(input.value, ""),
            action: text(input.action, "comment") as FilterRule["action"],
            note: text(input.note, ""),
            createdAt: isoMinutesAgo(0),
            createdBy: viewer.id,
          };
          yield* Ref.update(rules, (rows) => [...rows, rule]);
          return rule;
        }),
      )
      .handle("updateRule", ({ params, payload }) =>
        Effect.gen(function* () {
          const current = yield* findRule(params.id);
          const input = fields(payload);
          const updated = {
            ...current,
            ...(input.name === undefined
              ? {}
              : { name: text(input.name, current.name) }),
            ...(input.enabled === undefined
              ? {}
              : { enabled: flag(input.enabled, current.enabled) }),
            ...(input.match === undefined
              ? {}
              : {
                  match: text(
                    input.match,
                    current.match,
                  ) as FilterRule["match"],
                }),
            ...(input.target === undefined
              ? {}
              : {
                  target: text(
                    input.target,
                    current.target,
                  ) as FilterRule["target"],
                }),
            ...(input.value === undefined
              ? {}
              : { value: text(input.value, current.value) }),
            ...(input.action === undefined
              ? {}
              : {
                  action: text(
                    input.action,
                    current.action,
                  ) as FilterRule["action"],
                }),
            ...(input.note === undefined
              ? {}
              : { note: text(input.note, current.note) }),
          };
          yield* Ref.update(rules, (rows) =>
            rows.map((row) => (row.id === current.id ? updated : row)),
          );
          return updated;
        }),
      )
      .handle("deleteRule", ({ params }) =>
        Effect.gen(function* () {
          yield* findRule(params.id);
          yield* Ref.update(rules, (rows) =>
            rows.filter((row) => row.id !== params.id),
          );
          return { ok: true, id: params.id };
        }),
      );
  }),
);
