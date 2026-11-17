import { useAtomMount, useAtomSet, useAtomValue } from "@effect/atom-react";
import { Effect, Layer, Result, Stream } from "effect";
import { Atom } from "effect/reactivity";
import { useCallback, useMemo } from "react";
import type { JamId, OrgId } from "@/data/api/schemas/ids.ts";
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
  historyLoaded,
  newerLoaded,
  newestEventId,
  olderLoaded,
  type ThreadFeed,
} from "./feed";
import { liveEntries } from "./live";

/** Events per history page, as Capy's thread view requests them. */
export const HISTORY_PAGE_SIZE = 100;

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

/** The thread's feed: stored events, cursor and live turn. */
export const threadFeedAtom = Atom.family((_key: string) =>
  Atom.make<ThreadFeed>(emptyFeed).pipe(Atom.keepAlive),
);

/** Expanded state of work groups, clusters, batches and long messages, by row id. */
export const expandedIdsAtom = Atom.family((_key: string) =>
  Atom.make<ReadonlyMap<string, boolean>>(new Map()).pipe(Atom.keepAlive),
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
      const first = yield* fetchPage(key, {});
      get.set(feedAtom, historyLoaded(get.once(feedAtom), first));
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
            const page = yield* fetchPage(key, query);
            get.set(feedAtom, newerLoaded(get.once(feedAtom), page));
          }),
        ),
      );
    }),
  ),
);

/** Fetches the page before the oldest loaded event. */
export const loadOlderAtom = Atom.family((key: string) =>
  timelineRuntime.fn<void>()((_, get) =>
    Effect.gen(function* () {
      const feedAtom = threadFeedAtom(key);
      const feed = get.once(feedAtom);
      if (feed.olderCursor === null || feed.loadingOlder) return;
      get.set(feedAtom, { ...feed, loadingOlder: true });
      const page = yield* fetchPage(key, { before: feed.olderCursor }).pipe(
        Effect.tapError(() =>
          Effect.sync(() =>
            get.set(feedAtom, { ...get.once(feedAtom), loadingOlder: false }),
          ),
        ),
      );
      get.set(feedAtom, olderLoaded(get.once(feedAtom), page));
    }),
  ),
);

export interface ThreadTimeline extends Timeline {
  readonly live: ThreadFeed["live"];
  readonly loading: boolean;
  readonly loadingOlder: boolean;
  readonly hasOlder: boolean;
  readonly loadOlder: () => void;
}

/** Builds the timeline for one feed: the pure half of `useThreadTimeline`. */
export const timelineOf = (
  feed: ThreadFeed,
  expanded: ReadonlyMap<string, boolean>,
): Timeline =>
  buildTimeline(feed.events, {
    liveEntries: liveEntries(feed.live),
    liveSettled: feed.live.phase === "settled",
    truncatedHistory: feed.olderCursor !== null,
    expandedGroupIds: expanded,
  });

/** The thread view's rows, gaps and live turn, kept current by realtime. */
export const useThreadTimeline = (
  orgId: OrgId,
  threadId: JamId,
): ThreadTimeline => {
  const key = threadKey(orgId, threadId);
  useAtomMount(threadSyncAtom(key));
  const feed = useAtomValue(threadFeedAtom(key));
  const expanded = useAtomValue(expandedIdsAtom(key));
  const requestOlder = useAtomSet(loadOlderAtom(key));
  const loadOlder = useCallback(() => requestOlder(), [requestOlder]);
  const timeline = useMemo(() => timelineOf(feed, expanded), [feed, expanded]);
  return {
    ...timeline,
    live: feed.live,
    loading: feed.loading,
    loadingOlder: feed.loadingOlder,
    hasOlder: feed.olderCursor !== null,
    loadOlder,
  };
};

export { threadKey };
