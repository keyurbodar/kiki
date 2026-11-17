import { DateTime, Effect, Ref } from "effect";
import { fields, newId } from "../db/MockDb.ts";
import { minutesAgo } from "../fixtures/time.ts";
import { mockGroup } from "../mockGroup.ts";
import { type ReviewRule, sampleReviewRules } from "./fixtures.ts";

const text = (value: unknown) =>
  typeof value === "string" && value.length > 0 ? value : undefined;

const strings = (value: unknown): ReadonlyArray<string> | undefined => {
  if (!Array.isArray(value)) return undefined;
  const values = value.filter(
    (item): item is string => typeof item === "string" && item.length > 0,
  );
  return values.length > 0 ? values : undefined;
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
          return yield* Effect.die(new Error(`reviewRules: no rule ${id}`));
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
                row.scopes.includes(repo) ||
                row.scopes.includes("*"),
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
          const body = text(input.body);
          if (body === undefined) {
            return yield* Effect.die(
              new Error("reviewRules.create: body is required"),
            );
          }
          const timestamp = DateTime.formatIso(minutesAgo(0));
          const row: ReviewRule = {
            id: newId("rrule"),
            body,
            scopes: strings(input.scopes) ?? ["*"],
            file: text(input.file) ?? null,
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
            body: text(input.body) ?? current.body,
            scopes: strings(input.scopes) ?? current.scopes,
            file:
              input.file === null ? null : (text(input.file) ?? current.file),
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
