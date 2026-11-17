import { DateTime, Effect, Ref } from "effect";
import { fields, newId } from "../db/MockDb.ts";
import { minutesAgo } from "../fixtures/time.ts";
import { mockGroup } from "../mockGroup.ts";
import {
  type ReviewFilterRule,
  type ReviewIgnorePaths,
  sampleFilterRules,
  sampleIgnorePaths,
} from "./fixtures.ts";

const text = (value: unknown) =>
  typeof value === "string" && value.length > 0 ? value : undefined;

const repoScope = (value: unknown): string | null =>
  typeof value === "string" && value.length > 0 ? value : null;

const repoIds = (value: unknown): ReadonlyArray<number> =>
  Array.isArray(value)
    ? value.flatMap((item) => {
        const id = typeof item === "number" ? item : Number(item);
        return Number.isInteger(id) ? [id] : [];
      })
    : [];

const arrayOfText = (value: unknown): ReadonlyArray<string> =>
  Array.isArray(value)
    ? value.filter(
        (item): item is string => typeof item === "string" && item.length > 0,
      )
    : [];

const conditions = (
  value: unknown,
): ReadonlyArray<ReviewFilterRule["conditions"][number]> =>
  Array.isArray(value)
    ? value.flatMap((item) => {
        const row = fields(item);
        const field = text(row.field);
        if (
          field !== "label" &&
          field !== "base_branch" &&
          field !== "title_or_body" &&
          field !== "author"
        ) {
          return [];
        }
        return [
          {
            field,
            not: row.not === true,
            values: arrayOfText(row.values),
          },
        ];
      })
    : [];

export const ReviewFiltersMock = mockGroup("reviewFilters", (handlers) =>
  Effect.gen(function* () {
    const rules = yield* Ref.make<ReadonlyArray<ReviewFilterRule>>([
      ...sampleFilterRules,
    ]);
    const ignorePaths = yield* Ref.make<ReadonlyArray<ReviewIgnorePaths>>([
      ...sampleIgnorePaths,
    ]);

    const findRule = (id: string) =>
      Effect.gen(function* () {
        const rows = yield* Ref.get(rules);
        const row = rows.find((candidate) => candidate.id === id);
        if (!row) {
          return yield* Effect.die(
            new Error(`reviewFilters.rules: no row ${id}`),
          );
        }
        return row;
      });

    const findIgnorePaths = (id: string) =>
      Effect.gen(function* () {
        const rows = yield* Ref.get(ignorePaths);
        const row = rows.find((candidate) => candidate.id === id);
        if (!row) {
          return yield* Effect.die(
            new Error(`reviewFilters.ignorePaths: no row ${id}`),
          );
        }
        return row;
      });

    return handlers
      .handle("listRules", () =>
        Effect.gen(function* () {
          return {
            rules: yield* Ref.get(rules),
            repositories: sampleFilterRules.map((row) => ({
              githubRepoId: row.githubRepoId,
              repo: row.repo,
            })),
            repositoryConditionsEnabled: true,
          };
        }),
      )
      .handle("createRule", ({ payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const repo = repoScope(input.repo);
          const timestamp = DateTime.formatIso(minutesAgo(0));
          const row: ReviewFilterRule = {
            id: newId("rfilt"),
            repo,
            githubRepoId: 1003,
            conditions: conditions(input.conditions),
            repositoryCondition:
              fields(input.repositoryCondition).repoIds === undefined
                ? null
                : {
                    not: fields(input.repositoryCondition).not === true,
                    repoIds: repoIds(fields(input.repositoryCondition).repoIds),
                  },
            skipped: false,
            source: "manual",
            createdByUserId: null,
            createdByName: null,
            createdAt: timestamp,
            updatedAt: timestamp,
          };
          yield* Ref.update(rules, (rows) => [...rows, row]);
          return row;
        }),
      )
      .handle("updateRule", ({ params, payload }) =>
        Effect.gen(function* () {
          const current = yield* findRule(params.id);
          const input = fields(payload);
          const repositoryCondition =
            input.repositoryCondition === undefined
              ? current.repositoryCondition
              : fields(input.repositoryCondition).repoIds === undefined
                ? null
                : {
                    not: fields(input.repositoryCondition).not === true,
                    repoIds: repoIds(fields(input.repositoryCondition).repoIds),
                  };
          const updated: ReviewFilterRule = {
            ...current,
            repo:
              input.repo === undefined ? current.repo : repoScope(input.repo),
            conditions:
              input.conditions === undefined
                ? current.conditions
                : conditions(input.conditions),
            repositoryCondition,
            skipped: false,
            updatedAt: DateTime.formatIso(minutesAgo(0)),
          };
          yield* Ref.update(rules, (rows) =>
            rows.map((row) => (row.id === params.id ? updated : row)),
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
          return { id: params.id, deleted: true };
        }),
      )
      .handle("listIgnorePaths", () =>
        Effect.gen(function* () {
          return { ignorePaths: yield* Ref.get(ignorePaths) };
        }),
      )
      .handle("createIgnorePaths", ({ payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const repo = repoScope(input.repo);
          const timestamp = DateTime.formatIso(minutesAgo(0));
          const row: ReviewIgnorePaths = {
            id: newId("rpath"),
            repo,
            githubRepoId: 1003,
            patterns: arrayOfText(input.patterns),
            skipped: false,
            source: "manual",
            createdByUserId: null,
            createdByName: null,
            createdAt: timestamp,
            updatedAt: timestamp,
          };
          yield* Ref.update(ignorePaths, (rows) => [...rows, row]);
          return row;
        }),
      )
      .handle("updateIgnorePaths", ({ params, payload }) =>
        Effect.gen(function* () {
          const current = yield* findIgnorePaths(params.id);
          const input = fields(payload);
          const updated: ReviewIgnorePaths = {
            ...current,
            repo:
              input.repo === undefined ? current.repo : repoScope(input.repo),
            patterns:
              input.patterns === undefined
                ? current.patterns
                : arrayOfText(input.patterns),
            skipped: false,
            updatedAt: DateTime.formatIso(minutesAgo(0)),
          };
          yield* Ref.update(ignorePaths, (rows) =>
            rows.map((row) => (row.id === params.id ? updated : row)),
          );
          return updated;
        }),
      )
      .handle("deleteIgnorePaths", ({ params }) =>
        Effect.gen(function* () {
          yield* findIgnorePaths(params.id);
          yield* Ref.update(ignorePaths, (rows) =>
            rows.filter((row) => row.id !== params.id),
          );
          return { id: params.id, deleted: true };
        }),
      );
  }),
);
