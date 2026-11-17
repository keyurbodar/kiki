import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { makeThreadFixtures } from "@/data/events";
import { decodeEventPage, emptyFeed, historyLoaded } from "./feed";

const { events, jamId } = makeThreadFixtures();
const [first, second] = events;

/** A row shaped like a stored event whose id the client cannot read. */
const unreadable = {
  id: "evt_sample_message",
  jamId,
  kind: "message",
  state: "answered",
  createdAt: "2026-11-17T09:00:05.000Z",
  payload: {
    actor: { type: "user", userId: "user_sample_alex" },
    origin: { type: "web" },
    text: "The checkout test times out on staging.",
    files: [],
    delivery: "queue",
  },
};

const decode = (body: unknown) => Effect.runSync(decodeEventPage(body));

describe("decodeEventPage", () => {
  it("drops an unreadable row and keeps the rest of the page", () => {
    const page = decode({
      items: [first, unreadable, second],
      cursor: null,
      serverNow: "2026-11-17T09:00:10.000Z",
    });
    expect(page.items.map((event) => event.id)).toEqual([
      first?.id,
      second?.id,
    ]);
    expect(page.cursor).toBeNull();
  });

  it("still fails when the envelope itself is unreadable", () => {
    expect(() => decode({ items: "not a page" })).toThrow();
  });

  it("clears loading on a page with a dropped row", () => {
    const page = decode({ items: [unreadable, first], cursor: null });
    const feed = historyLoaded(emptyFeed, page);
    expect(feed.loading).toBe(false);
    expect(feed.events).toHaveLength(1);
  });
});
