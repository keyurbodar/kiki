import { Effect, Ref } from "effect";
import { fields, MockDb, missing } from "../db/MockDb.ts";
import { threads as worldThreads } from "../fixtures/world.ts";
import { mockGroup } from "../mockGroup.ts";
import { folderThreadItems, sampleRead } from "./fixtures.ts";

type FolderThread = Record<string, unknown> & {
  readonly id: string;
  readonly folderId: string;
};

export const ThreadCollectionMock = mockGroup("threadCollection", (handlers) =>
  Effect.gen(function* () {
    const { threadFolders } = yield* MockDb;
    const items = yield* Ref.make<ReadonlyArray<FolderThread>>(
      structuredClone(folderThreadItems),
    );

    return handlers
      .handle("folderThreads", ({ params, query }) =>
        Effect.gen(function* () {
          const folders = yield* Ref.get(threadFolders);
          if (!folders.some((folder) => folder.id === params.folderId)) {
            return yield* missing("threadFolders", params.folderId);
          }
          const rows = (yield* Ref.get(items))
            .filter((item) => item.folderId === params.folderId)
            .toSorted(
              (a, b) => Number(a.position ?? 0) - Number(b.position ?? 0),
            );
          const limit =
            query.limit === undefined ? rows.length : Number(query.limit);
          const start =
            typeof query.cursor === "string"
              ? rows.findIndex((item) => item.id === query.cursor) + 1
              : 0;
          const page = rows.slice(start, start + limit);
          const last = page.at(-1);
          return {
            items: page,
            cursor:
              start + limit < rows.length && last ? String(last.id) : null,
          };
        }),
      )
      .handle("read", ({ payload }) => {
        const input = fields(payload);
        return Effect.succeed({
          ...sampleRead,
          threadIds: Array.isArray(input.threadIds)
            ? input.threadIds.map(String)
            : typeof input.threadId === "string"
              ? [input.threadId]
              : [worldThreads.checkoutTest.id],
        });
      })
      .handle("byCode", ({ payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const code = String(input.code ?? input.threadCode ?? "");
          const lookup = new Map(
            Object.values(worldThreads).map((thread) => [
              `ACME-${thread.number}`,
              thread,
            ]),
          );
          const thread = lookup.get(code);
          if (!thread) {
            return yield* Effect.die(
              new Error(`threadCollection: no thread with code ${code}`),
            );
          }
          return {
            id: thread.id,
            threadNumber: thread.number,
            code,
            title: thread.title,
            projectId: thread.projectId,
          };
        }),
      );
  }),
);
