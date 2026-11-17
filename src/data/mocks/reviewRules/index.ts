import { Effect, Ref } from "effect";
import { fields, MockDb, missing, newId } from "../db/MockDb.ts";
import { isoMinutesAgo, viewer } from "../fixtures/world.ts";
import { mockGroup } from "../mockGroup.ts";
import { type ReviewRule, sampleRules, updatedAt } from "./fixtures.ts";

const text = (value: unknown, fallback: string) =>
  typeof value === "string" && value.length > 0 ? value : fallback;

const flag = (value: unknown, fallback: boolean) =>
  typeof value === "boolean" ? value : fallback;

const stringList = (value: unknown) =>
  Array.isArray(value) ? value.filter((id) => typeof id === "string") : [];

const patchRule = (input: Record<string, unknown>, current: ReviewRule) => ({
  ...current,
  ...(input.name === undefined ? {} : { name: text(input.name, current.name) }),
  ...(input.description === undefined
    ? {}
    : { description: text(input.description, current.description) }),
  ...(input.enabled === undefined
    ? {}
    : { enabled: flag(input.enabled, current.enabled) }),
  ...(input.priority === undefined
    ? {}
    : {
        priority: text(
          input.priority,
          current.priority,
        ) as ReviewRule["priority"],
      }),
  ...(input.action === undefined
    ? {}
    : { action: text(input.action, current.action) as ReviewRule["action"] }),
  ...(input.repoIds === undefined
    ? {}
    : { repoIds: stringList(input.repoIds) }),
  ...(input.authorIds === undefined
    ? {}
    : { authorIds: stringList(input.authorIds) }),
  ...(input.instruction === undefined
    ? {}
    : { instruction: text(input.instruction, current.instruction) }),
  updatedAt: updatedAt(),
});

const withRepoNames = (
  rule: ReviewRule,
  repos: ReadonlyArray<{ readonly id: string; readonly fullName: string }>,
) => ({
  ...rule,
  repoNames: rule.repoIds.map(
    (id) => repos.find((repo) => repo.id === id)?.fullName ?? id,
  ),
});

export const ReviewRulesMock = mockGroup("reviewRules", (handlers) =>
  Effect.gen(function* () {
    const db = yield* MockDb;
    const rules = yield* Ref.make<ReadonlyArray<ReviewRule>>([...sampleRules]);

    const find = (id: string) =>
      Effect.gen(function* () {
        const rows = yield* Ref.get(rules);
        const rule = rows.find((row) => row.id === id);
        if (!rule) {
          return yield* Effect.die(
            new Error(`reviewRules.rules: no row ${id}`),
          );
        }
        return rule;
      });

    const findMember = (id: string) =>
      Effect.gen(function* () {
        const people = yield* Ref.get(db.members);
        const member = people.find((row) => row.id === id);
        if (!member) return yield* missing("members", id);
        return member;
      });

    return handlers
      .handle("list", ({ query }) =>
        Effect.gen(function* () {
          const rows = yield* Ref.get(rules);
          const repos = yield* Ref.get(db.repos);
          const search = typeof query.search === "string" ? query.search : "";
          const enabled =
            typeof query.enabled === "string" ? query.enabled : "";
          return rows
            .filter((row) =>
              row.name.toLowerCase().includes(search.toLowerCase()),
            )
            .filter((row) => !enabled || String(row.enabled) === enabled)
            .map((row) => withRepoNames(row, repos));
        }),
      )
      .handle("create", ({ payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const authorId = text(input.authorId, viewer.id);
          if (authorId !== viewer.id) yield* findMember(authorId);
          const now = isoMinutesAgo(0);
          const rule: ReviewRule = {
            id: newId("rrule"),
            name: text(input.name, "New review rule"),
            description: text(input.description, "The default review rule."),
            enabled: flag(input.enabled, true),
            priority: text(input.priority, "normal") as ReviewRule["priority"],
            action: text(input.action, "comment") as ReviewRule["action"],
            repoIds: stringList(input.repoIds),
            authorIds: stringList(input.authorIds),
            instruction: text(
              input.instruction,
              "Review the changes carefully.",
            ),
            createdAt: now,
            updatedAt: now,
            createdBy: authorId,
          };
          yield* Ref.update(rules, (current) => [...current, rule]);
          const repos = yield* Ref.get(db.repos);
          return withRepoNames(rule, repos);
        }),
      )
      .handle("get", ({ params }) =>
        Effect.gen(function* () {
          const rule = yield* find(params.id);
          const repos = yield* Ref.get(db.repos);
          const author = yield* findMember(rule.createdBy).pipe(Effect.orDie);
          return { ...withRepoNames(rule, repos), createdByUser: author };
        }),
      )
      .handle("update", ({ params, payload }) =>
        Effect.gen(function* () {
          const current = yield* find(params.id);
          const updated = patchRule(fields(payload), current);
          yield* Ref.update(rules, (rows) =>
            rows.map((row) => (row.id === current.id ? updated : row)),
          );
          const repos = yield* Ref.get(db.repos);
          return withRepoNames(updated, repos);
        }),
      )
      .handle("remove", ({ params }) =>
        Effect.gen(function* () {
          yield* find(params.id);
          yield* Ref.update(rules, (rows) =>
            rows.filter((row) => row.id !== params.id),
          );
          return { ok: true, id: params.id };
        }),
      );
  }),
);
