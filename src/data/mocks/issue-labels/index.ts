import { Effect, Ref } from "effect";
import { fields, MockDb, missing, newId } from "../db/MockDb.ts";
import { mockGroup } from "../mockGroup.ts";

export const IssueLabelsMock = mockGroup("issue-labels", (handlers) =>
  Effect.gen(function* () {
    const { issueLabels, issues } = yield* MockDb;

    return handlers
      .handle("labels", () => Ref.get(issueLabels))
      .handle("createLabel", ({ payload }) => {
        const input = fields(payload);
        const label = {
          id: newId("lbl"),
          name: String(input.name ?? "New label"),
          color: String(input.color ?? "default"),
        };
        return Ref.update(issueLabels, (rows) => [...rows, label]).pipe(
          Effect.as(label),
        );
      })
      .handle("updateLabel", ({ params, payload }) =>
        Effect.gen(function* () {
          const rows = yield* Ref.get(issueLabels);
          const current = rows.find((row) => row.id === params.labelId);
          if (!current) return yield* missing("issueLabels", params.labelId);
          const input = fields(payload);
          const updated = {
            ...current,
            ...(typeof input.name === "string" ? { name: input.name } : {}),
            ...(typeof input.color === "string" ? { color: input.color } : {}),
          };
          yield* Ref.set(
            issueLabels,
            rows.map((row) => (row.id === current.id ? updated : row)),
          );
          return updated;
        }),
      )
      .handle("deleteLabel", ({ params }) =>
        Effect.gen(function* () {
          const rows = yield* Ref.get(issueLabels);
          if (!rows.some((row) => row.id === params.labelId)) {
            return yield* missing("issueLabels", params.labelId);
          }
          yield* Ref.set(
            issueLabels,
            rows.filter((row) => row.id !== params.labelId),
          );
          yield* Ref.update(issues, (all) =>
            all.map((issue) => ({
              ...issue,
              labelIds: issue.labelIds.filter((id) => id !== params.labelId),
            })),
          );
          return { ok: true };
        }),
      );
  }),
);
