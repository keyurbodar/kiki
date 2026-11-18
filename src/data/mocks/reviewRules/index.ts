import { DateTime, Effect, Ref } from "effect";
import { InvalidRequest } from "../../api/schemas/errors.ts";
import { fields, newId } from "../db/MockDb.ts";
import { minutesAgo } from "../fixtures/time.ts";
import { mockGroup } from "../mockGroup.ts";
import {
  allRepositories,
  type ReviewRule,
  type ReviewRuleFile,
  type ReviewRuleScope,
  sampleReviewRules,
} from "./fixtures.ts";

const text = (value: unknown) =>
  typeof value === "string" && value.length > 0 ? value : undefined;

const scopesOf = (
  value: unknown,
): ReadonlyArray<ReviewRuleScope> | undefined => {
  if (!Array.isArray(value) || value.length === 0) return undefined;
  return value.map((scope) => {
    const input = fields(scope);
    return {
      repo: text(input.repo) ?? null,
      paths: Array.isArray(input.paths)
        ? input.paths.filter((path): path is string => typeof path === "string")
        : [],
      githubRepoId: null,
      covered: true,
      heldByCaller: true,
    };
  });
};

const fileOf = (value: unknown): ReviewRuleFile | null | undefined => {
  if (value === null) return null;
  const input = fields(value);
  const repo = text(input.repo);
  const path = text(input.path);
  return repo === undefined || path === undefined
    ? undefined
    : { repo, path, githubRepoId: 0, covered: true };
};

export const ReviewRulesMock = mockGroup("reviewRules", (handlers) =>
  Effect.gen(function* () {
    const rules = yield* Ref.make<ReadonlyArray<ReviewRule>>([
      ...sampleReviewRules,
    ]);

    const findRule = (id: string) =>
      Effect.gen(function* () {
        const rows = yield* Ref.get(rules);
        const row = rows.find((candidate) => candidate.id === id);
        if (!row) {
          return yield* Effect.fail(
            new InvalidRequest({ message: `No review rule ${id}` }),
          );
        }
        return row;
      });

    return handlers
      .handle("list", ({ query }) =>
        Effect.gen(function* () {
          const input = fields(query);
          const repo = text(input.repo);
          const rows = yield* Ref.get(rules);
          return {
            rules: rows.filter(
              (row) =>
                repo === undefined ||
                row.scopes.some(
                  (scope) => scope.repo === null || scope.repo === repo,
                ),
            ),
            nextCursor: null,
          };
        }),
      )
      .handle("get", ({ params }) =>
        Effect.gen(function* () {
          const row = yield* findRule(params.id);
          return { rule: row };
        }),
      )
      .handle("create", ({ payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const body = text(input.body) ?? "";
          const file = fileOf(input.file) ?? null;
          if (body === "" && file === null) {
            return yield* Effect.fail(
              new InvalidRequest({
                message: "A review rule needs a body or a file",
              }),
            );
          }
          const timestamp = DateTime.formatIso(minutesAgo(0));
          const row: ReviewRule = {
            id: newId("rrule"),
            body,
            scopes: scopesOf(input.scopes) ?? [allRepositories],
            file,
            status: text(input.status) ?? "active",
            source: "manual",
            sourceRef: null,
            createdByUserId: null,
            createdByName: null,
            firedCount: 0,
            lastFired: null,
            createdAt: timestamp,
            updatedAt: timestamp,
          };
          yield* Ref.update(rules, (rows) => [...rows, row]);
          return { rule: row };
        }),
      )
      .handle("update", ({ params, payload }) =>
        Effect.gen(function* () {
          const current = yield* findRule(params.id);
          const input = fields(payload);
          const updated: ReviewRule = {
            ...current,
            body: typeof input.body === "string" ? input.body : current.body,
            scopes: scopesOf(input.scopes) ?? current.scopes,
            file:
              fileOf(input.file) ?? (input.file === null ? null : current.file),
            status: text(input.status) ?? current.status,
            updatedAt: DateTime.formatIso(minutesAgo(0)),
          };
          yield* Ref.update(rules, (rows) =>
            rows.map((row) => (row.id === params.id ? updated : row)),
          );
          return { id: params.id, rule: updated, deleted: false };
        }),
      )
      .handle("remove", ({ params }) =>
        Effect.gen(function* () {
          yield* findRule(params.id);
          yield* Ref.update(rules, (rows) =>
            rows.filter((row) => row.id !== params.id),
          );
          return { id: params.id, rule: null, deleted: true };
        }),
      );
  }),
);
