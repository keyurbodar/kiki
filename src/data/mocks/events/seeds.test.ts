import { assert, describe, it, layer } from "@effect/vitest";
import { Effect, Schema } from "effect";
import { ApiClient, makeApiClientLayer } from "@/data/client/ApiClient.ts";
import { EventId, EventPage, EventRow } from "@/data/events";
import { buildTimeline } from "@/features/thread/timeline/build.ts";
import {
  decodeEventPage,
  emptyFeed,
  historyLoaded,
} from "@/features/thread/timeline/feed.ts";
import { orgId, threads } from "../fixtures/world.ts";
import { MockTransport } from "../MockServices.ts";
import { messageVersions, outline, seedEvents } from "./fixtures.ts";
import { threadStateSeeds } from "./thread-states.ts";

const decodeId = Schema.decodeUnknownSync(EventId);
const decodeRow = Schema.decodeUnknownSync(EventRow);

/** Every row the events mock serves from a seed, in the shape the client decodes. */
const seededRows = [...seedEvents, ...threadStateSeeds];

const messageRowStates = new Set([
  "pending",
  "answered",
  "cancelled",
  "failed",
]);

describe("events mock seeds", () => {
  it.each(seededRows.map((row) => [row.id, row] as const))(
    "%s is a 26-character event id and decodes as an EventRow",
    (id, row) => {
      assert.strictEqual(decodeId(id), id);
      assert.strictEqual(id.length, 26);
      assert.strictEqual(decodeRow(row).kind, row.kind);
    },
  );

  it("seeds unique ids", () => {
    assert.strictEqual(
      new Set(seededRows.map((row) => row.id)).size,
      seededRows.length,
    );
  });

  it("points the outline and the message versions at seeded rows", () => {
    const ids = new Set(seededRows.map((row) => row.id));
    for (const section of outline) {
      assert.isTrue(ids.has(section.eventId), section.eventId);
      for (const child of section.children)
        assert.isTrue(ids.has(child), child);
    }
    for (const [root, versions] of Object.entries(messageVersions)) {
      assert.strictEqual(decodeId(root), root);
      for (const version of versions)
        assert.strictEqual(decodeId(version.id), version.id);
    }
  });

  it("keeps every message row in an input state", () => {
    for (const row of seededRows) {
      if (row.kind !== "message") continue;
      assert.isTrue(
        messageRowStates.has(row.state),
        `${row.id} is in the output state ${row.state}`,
      );
    }
  });
});

layer(makeApiClientLayer(MockTransport))(
  "events mock serves decodable pages",
  (it) => {
    const serve = (jamId: string) =>
      Effect.gen(function* () {
        const client = yield* ApiClient;
        return {
          jamId,
          body: yield* client.events.list({
            params: { orgId, jamId },
            query: {},
          }),
        };
      });

    it.effect("serves every thread a page the client decodes row for row", () =>
      Effect.gen(function* () {
        for (const thread of Object.values(threads)) {
          const { jamId, body } = yield* serve(thread.id);
          const served = (body as { items: ReadonlyArray<unknown> }).items;
          const page = yield* decodeEventPage(body);
          assert.strictEqual(
            page.items.length,
            served.length,
            `${jamId} dropped a row`,
          );
        }
      }),
    );

    it.effect("renders a transcript instead of leaving the feed loading", () =>
      Effect.gen(function* () {
        const { body } = yield* serve(threads.checkoutTest.id);
        const page = yield* decodeEventPage(body);
        const feed = historyLoaded(emptyFeed, page);
        assert.isFalse(feed.loading);
        assert.instanceOf(page, EventPage);
        const timeline = buildTimeline(feed.events, {
          liveEntries: [],
          liveSettled: false,
          truncatedHistory: feed.olderCursor !== null,
          expandedGroupIds: new Map(),
        });
        assert.isAbove(timeline.rows.length, 0);
        assert.isTrue(
          timeline.rows.some((row) => row.type === "user-message"),
          "no user message in the transcript",
        );
      }),
    );
  },
);
