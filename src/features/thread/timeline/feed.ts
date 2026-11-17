import { Schema } from "effect";
import {
  type EventId,
  EventPage,
  type EventRow,
  RealtimeServerFrame,
  type RealtimeServerMessage,
} from "@/data/events";
import { applyDelta, idleLive, type LiveTurn, liveToolCallIds } from "./live";

/** What the thread view holds for one thread: stored history plus the live turn. */
export interface ThreadFeed {
  readonly events: ReadonlyArray<EventRow>;
  readonly olderCursor: EventId | null;
  readonly live: LiveTurn;
  readonly loading: boolean;
  readonly loadingOlder: boolean;
  readonly serverNow: Date | undefined;
}

export const emptyFeed: ThreadFeed = {
  events: [],
  olderCursor: null,
  live: idleLive,
  loading: true,
  loadingOlder: false,
  serverNow: undefined,
};

export const decodeEventPage = Schema.decodeUnknownEffect(EventPage);
const decodeFrame = Schema.decodeUnknownOption(RealtimeServerFrame);

/** Merges events by id (a newer copy of a row replaces the older one) in id order. */
export const mergeEvents = (
  current: ReadonlyArray<EventRow>,
  incoming: ReadonlyArray<EventRow>,
): ReadonlyArray<EventRow> => {
  if (incoming.length === 0) return current;
  const byId = new Map(current.map((event) => [event.id, event]));
  for (const event of incoming) byId.set(event.id, event);
  return [...byId.values()].sort((a, b) => (a.id < b.id ? -1 : +(a.id > b.id)));
};

/** Newest stored event id: the `after` cursor for a hint refetch. */
export const newestEventId = (feed: ThreadFeed) => feed.events.at(-1)?.id;

/**
 * Drops a settled live turn once its tool calls are stored, so the stored rows
 * replace the streamed ones without a flash (Capy's live-to-history handoff).
 */
const handOff = (live: LiveTurn, events: ReadonlyArray<EventRow>): LiveTurn => {
  if (live.phase !== "settled") return live;
  const results = new Set(
    events.flatMap((event) =>
      event.kind === "tool_result" ? [event.payload.toolCallId as string] : [],
    ),
  );
  const ids = new Set(
    [
      ...liveToolCallIds(live),
      ...live.response.flatMap((part) =>
        part.type === "text" || part.type === "reasoning" ? [part.id] : [],
      ),
    ].filter((id) => id.length > 0),
  );
  const stored =
    ids.size === 0 ||
    events.some(
      (event) =>
        event.kind === "assistant" &&
        (ids.has(event.id) ||
          event.payload.blocks.some(
            (block) => "id" in block && ids.has(block.id),
          )),
    );
  if (!stored) return live;
  return {
    ...idleLive,
    children: new Map([...live.children].filter(([id]) => !results.has(id))),
  };
};

/** A jam_event hint: updates and deletes affect existing ids, so refetch without the `after` cursor. */
export const hintScope = (hint: {
  readonly table: string;
  readonly changedColumns: ReadonlyArray<string>;
}) => ({
  refetch: hint.table === "jam_event",
  affectedIds: hint.changedColumns.filter((column) =>
    /^[0-9A-Z]{26}$/.test(column),
  ),
});

export const historyLoaded = (
  feed: ThreadFeed,
  page: EventPage,
): ThreadFeed => {
  const events = mergeEvents(feed.events, page.items);
  return {
    ...feed,
    events,
    olderCursor: page.cursor,
    loading: false,
    serverNow: page.serverNow ?? feed.serverNow,
    live: handOff(feed.live, events),
  };
};

export const newerLoaded = (feed: ThreadFeed, page: EventPage): ThreadFeed => {
  const events = mergeEvents(feed.events, page.items);
  return {
    ...feed,
    events,
    serverNow: page.serverNow ?? feed.serverNow,
    live: handOff(feed.live, events),
  };
};

export const olderLoaded = (feed: ThreadFeed, page: EventPage): ThreadFeed => ({
  ...feed,
  events: mergeEvents(feed.events, page.items),
  olderCursor: page.cursor,
  loadingOlder: false,
});

export type RealtimeAction =
  | { readonly kind: "refetch" }
  | { readonly kind: "delta"; readonly feed: ThreadFeed }
  | { readonly kind: "ignore" };

/**
 * One realtime message for this thread: a `jam_event` hint asks for a refetch
 * after the newest stored event, a delta advances the live turn.
 */
export const applyRealtime = (
  feed: ThreadFeed,
  message: RealtimeServerMessage,
  jamId: string,
  now: Date,
): RealtimeAction => {
  if (message.type === "hint")
    return message.table === "jam_event" && message.scopes.jamId === jamId
      ? { kind: "refetch" }
      : { kind: "ignore" };
  if (message.type === "delta" && message.jamId === jamId)
    return {
      kind: "delta",
      feed: { ...feed, live: applyDelta(feed.live, message.delta, now) },
    };
  return { kind: "ignore" };
};

/** Decodes a realtime text frame; undecodable frames are dropped. */
export const decodeRealtimeFrame = (frame: string) => decodeFrame(frame);
