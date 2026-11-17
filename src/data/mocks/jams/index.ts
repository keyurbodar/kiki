import { DateTime, Effect, Ref } from "effect";
import { type ThreadCard, ThreadCardPage } from "../../api/schemas/thread.ts";
import { mockGroup } from "../mockGroup.ts";
import { sampleThreads } from "./fixtures.ts";

const defaultPageSize = 50;

const cursorOf = (thread: ThreadCard) =>
  `${DateTime.toEpochMillis(thread.sortActivityAt)}:${thread.id}`;

export const JamsMock = mockGroup("jams", (handlers) =>
  Effect.gen(function* () {
    const threads = yield* Ref.make<ReadonlyArray<ThreadCard>>(sampleThreads);

    return handlers.handle("list", ({ query }) =>
      Effect.gen(function* () {
        const search = query.search?.toLowerCase();
        const sortKey =
          query.sort === "createdAt" ? "createdAt" : "sortActivityAt";
        const matching = (yield* Ref.get(threads))
          .filter((thread) =>
            query.archived === "only" ? thread.archived : !thread.archived,
          )
          .filter(
            (thread) =>
              query.projectIds === undefined ||
              (thread.projectId !== null &&
                query.projectIds.includes(thread.projectId)),
          )
          .filter(
            (thread) =>
              search === undefined ||
              (thread.title ?? "").toLowerCase().includes(search),
          )
          .toSorted(
            (a, b) =>
              DateTime.toEpochMillis(b[sortKey]) -
              DateTime.toEpochMillis(a[sortKey]),
          );
        const start =
          query.cursor === undefined
            ? 0
            : matching.findIndex(
                (thread) => cursorOf(thread) === query.cursor,
              ) + 1;
        const limit = query.limit ?? defaultPageSize;
        const items = matching.slice(start, start + limit);
        const last = items.at(-1);
        const hasMore = start + limit < matching.length;
        return new ThreadCardPage({
          items,
          cursor: hasMore && last ? cursorOf(last) : null,
        });
      }),
    );
  }),
);
