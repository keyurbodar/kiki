import { Effect, Ref } from "effect";
import { MockDb, missing } from "../db/MockDb.ts";
import { mockGroup } from "../mockGroup.ts";
import { sampleRestore } from "./fixtures.ts";

export const RestoreMock = mockGroup("restore", (handlers) =>
  Effect.gen(function* () {
    const { issues } = yield* MockDb;
    const restores = yield* Ref.make<ReadonlyArray<Record<string, unknown>>>([
      structuredClone(sampleRestore),
    ]);

    return handlers.handle("restore", ({ params }) =>
      Effect.gen(function* () {
        const ids = sampleRestore.items.map((item) => item.id);
        const rows = yield* Ref.get(restores);
        const snapshot = rows.find((row) => row.orgId === params.orgId);
        if (!snapshot) return yield* missing("issues", params.orgId);
        const items = Array.isArray(snapshot.items)
          ? (snapshot.items as ReadonlyArray<Record<string, unknown>>)
          : [];
        const restored = items.filter((item) => ids.includes(String(item.id)));
        if (restored.length === 0) {
          return yield* Effect.die(
            new Error(`restore: no restorable items for ${ids.join(", ")}`),
          );
        }
        const issueIds = restored
          .filter((item) => item.kind === "issue")
          .map((item) => String(item.id));
        if (issueIds.length > 0) {
          yield* Ref.update(issues, (all) =>
            all.map((issue) =>
              issueIds.includes(issue.id)
                ? { ...issue, deletedAt: null }
                : issue,
            ),
          );
        }
        const result = {
          id: snapshot.id,
          orgId: params.orgId,
          status: "restored",
          restored,
          restoredCount: restored.length,
          restoredAt: sampleRestore.snapshotAt,
        };
        yield* Ref.set(restores, [result]);
        return result;
      }),
    );
  }),
);
