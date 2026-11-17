import { Schema } from "effect";
import { describe, expect, it } from "vitest";
import {
  ContextUsage,
  EVENT_KINDS,
  EventPage,
  EventRow,
  EventStreamLine,
  LIVE_DELTA_TYPES,
  LiveDelta,
  MessageVersionsWithBranches,
  makeThreadFixtures,
  RealtimeServerFrame,
  RealtimeServerMessage,
  TIMELINE_ROW_TYPES,
  TimelineRow,
} from "./index";

const fixtures = makeThreadFixtures();
const decodeEvent = Schema.decodeUnknownSync(EventRow);

describe("stored events", () => {
  it("has a fixture for every event kind", () => {
    const kinds = new Set(fixtures.events.map((event) => event.kind));
    expect([...kinds].sort()).toEqual([...EVENT_KINDS].sort());
  });

  it.each(fixtures.events.map((event) => [event.kind, event] as const))(
    "decodes and re-encodes a %s event",
    (_kind, encoded) => {
      const decoded = decodeEvent(encoded);
      expect(decoded.kind).toBe(encoded.kind);
      expect(decoded.createdAt).toBeInstanceOf(Date);
      expect(Schema.encodeSync(EventRow)(decoded)).toMatchObject({
        id: encoded.id,
        kind: encoded.kind,
      });
    },
  );

  it("keeps an unknown event kind as unsupported instead of failing", () => {
    const decoded = decodeEvent(fixtures.unknownKind);
    expect(decoded).toMatchObject({
      kind: "unsupported",
      of: "hologram_projection",
    });
    expect("payload" in decoded).toBe(false);
  });

  it("keeps an unknown tool result block as unsupported", () => {
    const toolResult = fixtures.events.find(
      (event) => event.kind === "tool_result",
    );
    const decoded = decodeEvent(toolResult);
    if (decoded.kind !== "tool_result") throw new Error("expected tool_result");
    expect(decoded.payload.blocks.map((block) => block.type)).toEqual([
      "text",
      "json",
      "unsupported",
    ]);
  });

  it("rejects a known kind with the wrong payload", () => {
    const message = fixtures.events.find((event) => event.kind === "message");
    expect(() => decodeEvent({ ...message, payload: { text: 1 } })).toThrow();
  });

  it("rejects an event id that is not 26 characters", () => {
    expect(() => decodeEvent({ ...fixtures.events[0], id: "short" })).toThrow();
  });

  it("decodes Slack context with its encoded forwardedImages key", () => {
    const decoded = decodeEvent({
      ...fixtures.events[0],
      payload: {
        actor: { type: "system", service: "slack" },
        origin: { type: "system" },
        provider: "slack",
        context: {
          mode: "snapshot",
          channel: { channelId: "C0SAMPLE" },
          participants: [],
          thread: { ts: "1.0", messages: [] },
          forwardedImages: [],
        },
      },
    });
    if (decoded.kind !== "context") throw new Error("expected context");
    expect(decoded.payload.context).toHaveProperty("forwardedFiles", []);
  });
});

describe("events API responses", () => {
  it("decodes an EventPage", () => {
    const page = Schema.decodeUnknownSync(EventPage)({
      items: fixtures.events,
      cursor: fixtures.events.at(-1)?.id,
      serverNow: "2026-11-17T09:02:00.000Z",
    });
    expect(page.items).toHaveLength(fixtures.events.length);
  });

  it("decodes every NDJSON stream line", () => {
    const ndjson = fixtures.streamLines
      .map((line) => JSON.stringify(line))
      .join("\n");
    const lines = ndjson
      .split("\n")
      .map((line) =>
        Schema.decodeUnknownSync(Schema.fromJsonString(EventStreamLine))(line),
      );
    expect(lines[0]?.kind).toBe("page");
    expect(lines.at(-1)?.kind).toBe("end");
    expect(lines.filter((line) => line.kind === "event")).toHaveLength(
      fixtures.events.length,
    );
  });

  it("decodes context usage and message versions", () => {
    expect(
      Schema.decodeUnknownSync(ContextUsage)({
        usedTokens: 42_000,
        budgetTokens: 200_000,
        bound: "context",
        segments: [{ key: "conversation", tokens: 30_000 }],
      }).usedTokens,
    ).toBe(42_000);
    const message = fixtures.events.find((event) => event.kind === "message");
    const versions = Schema.decodeUnknownSync(MessageVersionsWithBranches)({
      root: message?.id,
      versions: [
        {
          id: message?.id,
          text: "v1",
          createdAt: message?.createdAt,
          live: true,
          branch: [message],
        },
      ],
    });
    expect(versions.versions[0]?.branch[0]?.kind).toBe("message");
  });
});

describe("live deltas and realtime frames", () => {
  it("covers every delta type", () => {
    const types = new Set(fixtures.liveTurn.map((delta) => delta.type));
    expect([...types].sort()).toEqual([...LIVE_DELTA_TYPES].sort());
  });

  it("decodes a full live turn", () => {
    const decoded = fixtures.liveTurn.map((delta) =>
      Schema.decodeUnknownSync(LiveDelta)(delta),
    );
    expect(decoded.at(-1)).toEqual({ type: "run-end", status: "idle" });
  });

  it("keeps an unknown delta as unsupported", () => {
    expect(Schema.decodeUnknownSync(LiveDelta)(fixtures.unknownDelta)).toEqual({
      type: "unsupported",
      of: "hologram-delta",
    });
  });

  it("decodes realtime frames from JSON text", () => {
    const frames = fixtures.realtimeFrames.map((frame) =>
      Schema.decodeUnknownSync(RealtimeServerFrame)(JSON.stringify(frame)),
    );
    expect(frames.map((frame) => frame.type)).toContain("delta");
    expect(() =>
      Schema.decodeUnknownSync(RealtimeServerMessage)({
        type: "subscribed",
        scopes: ["team:1"],
      }),
    ).toThrow();
  });
});

describe("timeline rows", () => {
  it("covers every row type", () => {
    const types = new Set(fixtures.rows.map((row) => row.type));
    expect([...types].sort()).toEqual([...TIMELINE_ROW_TYPES].sort());
  });

  it.each(fixtures.rows.map((row) => [row.type, row.id, row] as const))(
    "decodes a %s row (%s)",
    (_type, _id, row) => {
      const decoded = Schema.decodeUnknownSync(TimelineRow)(row);
      expect(decoded.type).toBe(row.type);
    },
  );
});

describe("fixture generator", () => {
  it("is deterministic and honours the thread id", () => {
    const a = makeThreadFixtures({ jamId: "jam_x", startMs: 0 });
    const b = makeThreadFixtures({ jamId: "jam_x", startMs: 0 });
    expect(a).toEqual(b);
    expect(a.events.every((event) => event.jamId === "jam_x")).toBe(true);
    expect(new Set(a.events.map((event) => event.id)).size).toBe(
      a.events.length,
    );
  });
});
