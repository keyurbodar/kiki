import { Effect, Ref } from "effect";
import { JamNotFound } from "../../api/schemas/errors.ts";
import { JamId } from "../../api/schemas/ids.ts";
import { MockDb, notFound } from "../db/MockDb.ts";
import { mockGroup } from "../mockGroup.ts";
import { childThreads, taskThreads } from "./fixtures.ts";

const defaultPageSize = 3;

export const ChildrenMock = mockGroup("children", (handlers) =>
  Effect.gen(function* () {
    const { machines } = yield* MockDb;
    const children = yield* Ref.make<ReadonlyArray<Record<string, unknown>>>(
      structuredClone(childThreads),
    );

    return handlers
      .handle("list", ({ params }) =>
        Effect.gen(function* () {
          const rows = yield* Ref.get(children);
          const allMachines = yield* Ref.get(machines);
          const matching = rows.filter((row) => row.parentId === params.jamId);
          if (
            matching.length === 0 &&
            !allMachines.some((machine) => machine.threadId === params.jamId)
          ) {
            return yield* notFound("machines", params.jamId);
          }
          return matching.map((row) => ({
            ...row,
            machineCount: allMachines.filter(
              (machine) => machine.threadId === row.id,
            ).length,
          }));
        }),
      )
      .handle("page", ({ params, query }) =>
        Effect.gen(function* () {
          const rows = yield* Ref.get(children);
          const matching = rows.filter((row) => row.parentId === params.jamId);
          const limit = Number(query.limit ?? defaultPageSize);
          const cursor = query.cursor;
          const start =
            typeof cursor === "string"
              ? matching.findIndex((row) => row.id === cursor) + 1
              : 0;
          const items = matching.slice(start, start + limit);
          const last = items.at(-1);
          return {
            items,
            cursor:
              start + limit < matching.length && last ? String(last.id) : null,
          };
        }),
      )
      .handle("taskThread", ({ params }) =>
        Effect.gen(function* () {
          const taskId = params.taskId;
          const task = taskThreads.find((row) => row.taskId === taskId);
          if (!task) {
            return yield* Effect.fail(
              new JamNotFound({ jamId: JamId.make(taskId) }),
            );
          }
          return { ...task };
        }),
      );
  }),
);
