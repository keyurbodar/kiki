import { Effect, Ref } from "effect";
import { MockDb, notFound } from "../db/MockDb.ts";
import { mockGroup } from "../mockGroup.ts";

export const IssueStatesMock = mockGroup("issue-states", (handlers) =>
  Effect.gen(function* () {
    const { issues, issueStates } = yield* MockDb;

    return handlers
      .handle("deleteState", ({ params }) =>
        Effect.gen(function* () {
          const rows = yield* Ref.get(issueStates);
          const current = rows.find((row) => row.id === params.stateId);
          if (!current) return yield* notFound("issueStates", params.stateId);
          yield* Ref.set(
            issueStates,
            rows.filter((row) => row.id !== current.id),
          );
          yield* Ref.set(
            issues,
            (yield* Ref.get(issues)).map((issue) => ({
              ...issue,
              stateId:
                issue.stateId === current.id
                  ? "ist_sample_todo"
                  : issue.stateId,
            })),
          );
          return { ok: true, stateId: current.id };
        }),
      )
      .handle("setDefaultState", ({ params }) =>
        Effect.gen(function* () {
          const rows = yield* Ref.get(issueStates);
          const current = rows.find((row) => row.id === params.stateId);
          if (!current) return yield* notFound("issueStates", params.stateId);
          const updated = rows.map((row) => ({
            ...row,
            isDefault:
              row.category === current.category
                ? row.id === current.id
                : row.isDefault,
          }));
          yield* Ref.set(issueStates, updated);
          return updated.find((row) => row.id === current.id);
        }),
      );
  }),
);
