import type { EventId, JamId, UserId } from "@/data/api/schemas/ids.ts";
import type { EventRow, Mention } from "@/data/events";

/** The gesture a send carried: queue holds it, steer and interrupt reach the turn. */
type Delivery = Extract<EventRow, { kind: "message" }>["payload"]["delivery"];

import type { ComposerMention } from "@/components/composer/types";

const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

const base32 = (value: number, length: number) => {
  let output = "";
  let rest = value;
  for (let index = 0; index < length; index += 1) {
    output = ALPHABET[rest % 32] + output;
    rest = Math.floor(rest / 32);
  }
  return output;
};

/**
 * A 26-character Crockford id for a row this tab has not stored yet. Ten time
 * digits first, so it sorts after everything already stored, then random
 * digits: the row is identified by its client key, not by this id.
 */
export const pendingEventId = (at: Date) => {
  let random = "";
  for (let index = 0; index < 16; index += 1)
    random += ALPHABET[Math.floor(Math.random() * 32)];
  return `${base32(at.getTime(), 10)}${random}` as EventId;
};

/** The mention kinds a stored message carries; the composer names more. */
const STORED_MENTION_KINDS: ReadonlySet<string> = new Set<Mention["kind"]>([
  "file",
  "thread",
  "pr",
  "skill",
  "secret",
  "excerpt",
  "device",
  "task",
  "slack_channel",
  "user",
]);

const storedMentions = (
  mentions: ReadonlyArray<ComposerMention>,
): ReadonlyArray<Mention> =>
  mentions.flatMap((mention) =>
    STORED_MENTION_KINDS.has(mention.kind)
      ? [
          {
            kind: mention.kind as Mention["kind"],
            id: mention.id,
            label: mention.label,
            start: mention.start,
            end: mention.end,
            text: mention.text,
          },
        ]
      : [],
  );

/** What the composer submits, as the pending row keeps it. */
export type PendingMessage = {
  readonly clientKey: string;
  readonly text: string;
  readonly mentions: ReadonlyArray<ComposerMention>;
  readonly delivery: Delivery;
  readonly userId: UserId;
};

/**
 * The row a send appends before the store answers: the composer's own actor,
 * text and gesture, marked `pending` and keyed by the client key the send
 * carries, so the stored row replaces it instead of joining it.
 */
export const pendingMessageEvent = (
  jamId: JamId,
  message: PendingMessage,
  at: Date,
): EventRow => ({
  id: pendingEventId(at),
  jamId,
  kind: "message",
  state: "pending",
  createdAt: at,
  payload: {
    actor: { type: "user", userId: message.userId },
    origin: { type: "web", userId: message.userId },
    text: message.text,
    files: [],
    delivery: message.delivery,
    mentions: storedMentions(message.mentions),
    clientKey: message.clientKey,
  },
});

const clientKeyOf = (event: EventRow) =>
  event.kind === "message" ? event.payload.clientKey : undefined;

/**
 * Drops the pending rows a page has answered: a stored row with the same client
 * key is the same message, so keeping both would show the send twice.
 */
export const withoutAnswered = (
  pending: ReadonlyArray<EventRow>,
  events: ReadonlyArray<EventRow>,
): ReadonlyArray<EventRow> => {
  if (pending.length === 0) return pending;
  const answered = new Set(
    events.flatMap((event) => {
      const key = clientKeyOf(event);
      return key === undefined ? [] : [key];
    }),
  );
  const kept = pending.filter((event) => {
    const key = clientKeyOf(event);
    return key !== undefined && !answered.has(key);
  });
  return kept.length === pending.length ? pending : kept;
};

/** The pending rows still to draw: the ones no fetched page has answered. */
export const pendingRows = (feed: {
  readonly events: ReadonlyArray<EventRow>;
  readonly pending: ReadonlyArray<EventRow>;
}) => withoutAnswered(feed.pending, feed.events);
