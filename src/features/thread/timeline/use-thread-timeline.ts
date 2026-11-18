import {
  useAtomMount,
  useAtomRefresh,
  useAtomSet,
  useAtomValue,
} from "@effect/atom-react";
import { Effect, Layer, Result, Stream } from "effect";
import { Atom } from "effect/reactivity";
import { useCallback, useMemo } from "react";
import type { EventId, JamId, OrgId } from "@/data/api/schemas/ids.ts";
import { idleAtom } from "@/data/atoms/idle.ts";
import { ApiClient, makeApiClientLayer } from "@/data/client/ApiClient.ts";
import { ApiTransport } from "@/data/client/transport.ts";
import {
  RealtimeSocket,
  RealtimeSocketFake,
} from "@/data/realtime/RealtimeSocket.ts";
import { buildTimeline, type Timeline } from "./build";
import {
  applyRealtime,
  decodeEventPage,
  decodeRealtimeFrame,
  emptyFeed,
  hintScope,
  historyFailed,
  historyLoaded,
  historyPending,
  newerLoaded,
  newestEventId,
  olderLoaded,
  type ThreadFeed,
} from "./feed";
import { liveEntries } from "./live";
import type { PendingMessage } from "./pending";
import { pendingMessageEvent, pendingRows } from "./pending";

/** Events per history page, as Capy's thread view requests them. */
export const HISTORY_PAGE_SIZE = 100;

/**
 * How long the first history page may stay in flight. A read that never
 * answers is a failure, not a transcript that is still on its way: past this
 * bound the view says so and offers a retry instead of shimmering.
 */
export const HISTORY_TIMEOUT_MS = 20_000;

/** API client plus the realtime socket (the fake one until the host is decoded). */
export const timelineLayer = Layer.mergeAll(
  makeApiClientLayer(ApiTransport),
  RealtimeSocketFake,
);

const timelineRuntime = Atom.runtime(timelineLayer);

const threadKey = (orgId: OrgId, jamId: JamId) => `${orgId}/${jamId}`;
const splitKey = (key: string) => {
  const [orgId, jamId] = key.split("/") as [string, string];
  return { orgId, jamId };
};

const fetchPage = (
  key: string,
  query: { readonly after?: string; readonly before?: string },
) =>
  Effect.gen(function* () {
    const client = yield* ApiClient;
    const body = yield* client.events.list({
      params: splitKey(key),
      query: { limit: String(HISTORY_PAGE_SIZE), ...query } as never,
    });
    return yield* decodeEventPage(body);
  });

/**
 * Nothing to follow while the org is unknown: the same idle rule the list reads
 * follow, so a placeholder org never issues a request that cannot succeed.
 */
const idleSyncAtom = idleAtom<void>();

/** The thread's feed: stored events, cursor and live turn. */
export const threadFeedAtom = Atom.family((_key: string) =>
  Atom.make<ThreadFeed>(emptyFeed).pipe(Atom.keepAlive),
);

/** Expanded state of work groups, clusters, batches and long messages, by row id. */
export const expandedIdsAtom = Atom.family((_key: string) =>
  Atom.make<ReadonlyMap<string, boolean>>(new Map()).pipe(Atom.keepAlive),
);

/** The sent message the composer is editing: the row, the event it replaces and its text. */
export type EditDraft = {
  readonly rowId: string;
  readonly eventId: EventId;
  readonly text: string;
};

/** The thread's pending edit, null when the composer is composing a new message. */
export const editDraftAtom = Atom.family((_key: string) =>
  Atom.make<EditDraft | null>(null).pipe(Atom.keepAlive),
);

/**
 * Loads the newest history page, then follows the realtime socket: a
 * `jam_event` hint refetches after the newest stored event, a delta advances
 * the live turn. Mount it while the thread is on screen.
 *
 * The feed is read with `get.once`: a reactive read would make this effect a
 * dependent of the atom it writes, so every page it stores would re-run it.
 */
export const threadSyncAtom = Atom.family((key: string) =>
  timelineRuntime.atom((get) =>
    Effect.gen(function* () {
      const feedAtom = threadFeedAtom(key);
      const { jamId } = splitKey(key);
      get.set(feedAtom, historyPending(get.once(feedAtom)));
      const first = yield* fetchPage(key, {}).pipe(
        Effect.timeout(HISTORY_TIMEOUT_MS),
        Effect.result,
      );
      if (Result.isFailure(first)) {
        yield* Effect.logWarning("thread history: the first page failed", {
          jamId,
          detail: String(first.failure),
        });
        get.set(feedAtom, historyFailed(get.once(feedAtom)));
        return;
      }
      get.set(feedAtom, historyLoaded(get.once(feedAtom), first.success));
      const socket = yield* RealtimeSocket;
      yield* socket.send(
        JSON.stringify({ type: "subscribe", scopes: [`jam:${jamId}`] }),
      );
      yield* socket.messages.pipe(
        Stream.filterMap((frame) =>
          Result.fromOption(decodeRealtimeFrame(frame), () => frame),
        ),
        Stream.runForEach((message) =>
          Effect.gen(function* () {
            const feed = get.once(feedAtom);
            const action = applyRealtime(feed, message, jamId, new Date());
            if (action.kind === "delta") get.set(feedAtom, action.feed);
            if (action.kind !== "refetch") return;
            const current = get.once(feedAtom);
            const hint =
              message.type === "hint" ? hintScope(message) : undefined;
            const after =
              hint?.affectedIds.length === 0
                ? newestEventId(current)
                : undefined;
            const query = after === undefined ? {} : { after };
            const page = yield* fetchPage(key, query).pipe(
              Effect.timeout(HISTORY_TIMEOUT_MS),
              Effect.result,
            );
            if (Result.isFailure(page)) return;
            get.set(feedAtom, newerLoaded(get.once(feedAtom), page.success));
          }),
        ),
      );
    }),
  ),
);

/**
 * Reads the newest events again and merges them into the feed. A send needs
 * this: the fake socket carries no frame for a message this tab just posted, so
 * the row exists in the store and the timeline never asks for it.
 */
export const refreshNewestAtom = Atom.family((key: string) =>
  timelineRuntime.fn<void>()((_, get) =>
    Effect.gen(function* () {
      const feedAtom = threadFeedAtom(key);
      const after = newestEventId(get(feedAtom));
      const page = yield* fetchPage(key, after === undefined ? {} : { after });
      get.set(feedAtom, newerLoaded(get(feedAtom), page));
    }),
  ),
);

/** Appends the row a send shows before the store answers it. */
export const appendPendingAtom = Atom.family((key: string) =>
  timelineRuntime.fn<PendingMessage>()((message, get) =>
    Effect.sync(() => {
      const feedAtom = threadFeedAtom(key);
      const feed = get(feedAtom);
      const { jamId } = splitKey(key);
      get.set(feedAtom, {
        ...feed,
        pending: [
          ...feed.pending,
          pendingMessageEvent(jamId as JamId, message, new Date()),
        ],
      });
    }),
  ),
);

/** Drops the row a failed send appended, by the client key it was sent with. */
export const removePendingAtom = Atom.family((key: string) =>
  timelineRuntime.fn<string>()((clientKey, get) =>
    Effect.sync(() => {
      const feedAtom = threadFeedAtom(key);
      const feed = get(feedAtom);
      get.set(feedAtom, {
        ...feed,
        pending: feed.pending.filter(
          (event) =>
            event.kind !== "message" || event.payload.clientKey !== clientKey,
        ),
      });
    }),
  ),
);

/** Fetches the page before the oldest loaded event. */
export const loadOlderAtom = Atom.family((key: string) =>
  timelineRuntime.fn<void>()((_, get) =>
    Effect.gen(function* () {
      const feedAtom = threadFeedAtom(key);
      const feed = get(feedAtom);
      if (feed.olderCursor === null || feed.loadingOlder) return;
      get.set(feedAtom, { ...feed, loadingOlder: true });
      const page = yield* fetchPage(key, { before: feed.olderCursor }).pipe(
        Effect.tapError(() =>
          Effect.sync(() =>
            get.set(feedAtom, { ...get(feedAtom), loadingOlder: false }),
          ),
        ),
      );
      get.set(feedAtom, olderLoaded(get(feedAtom), page));
    }),
  ),
);

export interface ThreadTimeline extends Timeline {
  readonly live: ThreadFeed["live"];
  readonly loading: boolean;
  /** The history page failed: the view offers a retry instead of a skeleton. */
  readonly failed: boolean;
  readonly retry: () => void;
  readonly loadingOlder: boolean;
  readonly hasOlder: boolean;
  readonly loadOlder: () => void;
}

/** Builds the timeline for one feed: the pure half of `useThreadTimeline`. */
export const timelineOf = (
  feed: ThreadFeed,
  expanded: ReadonlyMap<string, boolean>,
  editOf?: EventId,
): Timeline =>
  buildTimeline([...feed.events, ...pendingRows(feed)], {
    liveEntries: liveEntries(feed.live),
    liveSettled: feed.live.phase === "settled",
    truncatedHistory: feed.olderCursor !== null,
    expandedGroupIds: expanded,
    editOf,
  });

/** The thread view's rows, gaps and live turn, kept current by realtime. */
export const useThreadTimeline = (
  orgId: OrgId | undefined,
  threadId: JamId,
): ThreadTimeline => {
  const key = threadKey(orgId ?? ("" as OrgId), threadId);
  useAtomMount(orgId === undefined ? idleSyncAtom : threadSyncAtom(key));
  const feed = useAtomValue(threadFeedAtom(key));
  const expanded = useAtomValue(expandedIdsAtom(key));
  const editOf = useAtomValue(editDraftAtom(key))?.eventId;
  const requestOlder = useAtomSet(loadOlderAtom(key));
  const loadOlder = useCallback(() => requestOlder(), [requestOlder]);
  const retry = useAtomRefresh(threadSyncAtom(key));
  const timeline = useMemo(
    () => timelineOf(feed, expanded, editOf),
    [feed, expanded, editOf],
  );
  return {
    ...timeline,
    live: feed.live,
    loading: feed.loading,
    failed: feed.failed,
    retry,
    loadingOlder: feed.loadingOlder,
    hasOlder: feed.olderCursor !== null,
    loadOlder,
  };
};

export { threadKey };
