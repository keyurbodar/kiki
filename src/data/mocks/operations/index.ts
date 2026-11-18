import { Effect, Ref } from "effect";
import { MockDb, notFound, notFoundNamed } from "../db/MockDb.ts";
import { mockGroup } from "../mockGroup.ts";
import { sampleOperations } from "./fixtures.ts";

type Operation = Record<string, unknown> & {
  readonly id: string;
  readonly threadId: string;
};

export const OperationsMock = mockGroup("operations", (handlers) =>
  Effect.gen(function* () {
    const { machines } = yield* MockDb;
    const operations = yield* Ref.make<ReadonlyArray<Operation>>(
      structuredClone(sampleOperations),
    );

    return handlers
      .handle("list", ({ params }) =>
        Effect.gen(function* () {
          const rows = yield* Ref.get(operations);
          const matching = rows.filter((row) => row.threadId === params.jamId);
          if (matching.length === 0) {
            const known = (yield* Ref.get(machines)).some(
              (machine) => machine.threadId === params.jamId,
            );
            if (!known) return yield* notFoundNamed("thread", params.jamId);
          }
          return matching;
        }),
      )
      .handle("cancelSubscription", ({ params }) =>
        Effect.gen(function* () {
          const rows = yield* Ref.get(operations);
          const operation = rows.find((row) => row.id === params.operationId);
          if (!operation)
            return yield* notFoundNamed("operation", params.operationId);
          if (operation.threadId !== params.jamId) {
            return yield* notFound("machines", params.jamId);
          }
          const canceled = {
            ...operation,
            status: "canceled",
            cancelable: false,
          };
          yield* Ref.set(
            operations,
            rows.map((row) => (row.id === operation.id ? canceled : row)),
          );
          return { ok: true, operation: canceled };
        }),
      );
  }),
);
