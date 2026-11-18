import { Schema } from "effect";
import { describe, expect, it } from "vitest";
import { EventRow } from "@/data/events";
import { buildTimeline } from "./build";

const decodeEvent = Schema.decodeUnknownSync(EventRow);

const id = (suffix: string) => `01JA000000000000000000${suffix}`;

const message = (
  suffix: string,
  text: string,
  options: {
    state?: "answered" | "pending";
    editOf?: string;
    delivery?: "queue" | "steer" | "interrupt";
  } = {},
): EventRow =>
  decodeEvent({
    id: id(suffix),
    jamId: "jam_edit",
    kind: "message",
    state: options.state ?? "answered",
    createdAt: "2026-11-17T09:00:00.000Z",
    payload: {
      actor: { type: "user", userId: "user_sample" },
      origin: { type: "web" },
      text,
      files: [],
      delivery: options.delivery ?? "interrupt",
      ...(options.editOf === undefined ? {} : { editOf: options.editOf }),
    },
  });

const rowsOf = (events: ReadonlyArray<EventRow>, editOf?: string) =>
  buildTimeline(events, {
    liveEntries: [],
    liveSettled: false,
    expandedGroupIds: new Map(),
    editOf: editOf as never,
  }).rows.flatMap((row) => (row.type === "user-message" ? [row.text] : []));

describe("buildTimeline with an edited message", () => {
  const events = [
    message("000A", "first"),
    message("000B", "second"),
    message("000C", "third"),
  ];

  it("keeps the thread as it reads without an edit", () => {
    expect(rowsOf(events)).toEqual(["first", "second", "third"]);
  });

  it("holds back the edited message and everything after it", () => {
    expect(rowsOf(events, id("000B"))).toEqual(["first"]);
  });

  it("holds back the whole thread when the first message is edited", () => {
    expect(rowsOf(events, id("000A"))).toEqual([]);
  });

  it("keeps a sent edit above its own boundary", () => {
    const withEdit = [
      ...events,
      message("000D", "second, reworded", {
        state: "pending",
        editOf: id("000B"),
      }),
    ];
    expect(rowsOf(withEdit)).toEqual(["first", "second, reworded"]);
  });

  it("truncates from the smallest boundary of a sent edit and a composer edit", () => {
    const withEdit = [
      ...events,
      message("000D", "second, reworded", {
        state: "pending",
        editOf: id("000B"),
      }),
    ];
    expect(rowsOf(withEdit, id("000C"))).toEqual(["first", "second, reworded"]);
  });
});

describe("buildTimeline with a message this tab just sent", () => {
  const withPending = (delivery: "queue" | "steer" | "interrupt") => [
    message("000A", "first"),
    message("000B", "the send", { state: "pending", delivery }),
  ];

  it("draws a steer send as a row of its own", () => {
    const rows = buildTimeline(withPending("steer"), {
      liveEntries: [],
      liveSettled: false,
      expandedGroupIds: new Map(),
    }).rows;
    expect(rowsOf(withPending("steer"))).toEqual(["first", "the send"]);
    expect(
      rows.some(
        (row) => row.type === "user-message" && row.state === "pending",
      ),
    ).toBe(true);
  });

  it("holds a queued send out of the transcript until the turn ends", () => {
    expect(rowsOf(withPending("queue"))).toEqual(["first"]);
    expect(
      buildTimeline(withPending("queue"), {
        liveEntries: [],
        liveSettled: false,
        expandedGroupIds: new Map(),
      }).queued.map((queued) => queued.text),
    ).toEqual(["the send"]);
  });
});

describe("an assistant turn's reply", () => {
  const assistant = (
    suffix: string,
    stopReason: "end_turn" | "tool_use",
    blocks: unknown[],
  ): EventRow =>
    decodeEvent({
      id: id(suffix),
      jamId: "jam_edit",
      kind: "assistant",
      state: "committed",
      createdAt: "2026-11-17T09:00:05.000Z",
      payload: {
        actor: { type: "agent", jamId: "jam_edit" },
        origin: { type: "system" },
        model: {
          modelId: "anthropic/claude-sample",
          providerModelId: "claude-sample",
          reasoningMode: "medium",
        },
        route: { source: "capy" },
        usage: {
          inputTokens: 10,
          outputTokens: 20,
          cacheReadTokens: 0,
          cacheWriteTokens: 0,
        },
        stopReason,
        blocks,
      },
    });

  const types = (events: ReadonlyArray<EventRow>) =>
    buildTimeline(events, {
      liveEntries: [],
      liveSettled: false,
      expandedGroupIds: new Map(),
    }).rows.flatMap((row) =>
      row.type === "agent-message"
        ? [`agent-message:${row.text}`]
        : row.type === "work-group"
          ? row.entries.flatMap((entry) =>
              entry.type === "activity" && entry.kind === "text"
                ? [`step:${entry.text}`]
                : [],
            )
          : [],
    );

  it("renders the closing text as its own message, not a step", () => {
    const rows = types([
      message("000D", "why did it fail?"),
      assistant("000E", "end_turn", [
        {
          id: "blk_a",
          type: "thinking",
          text: "Check the budget.",
          presentation: "summary",
        },
        {
          id: "blk_b",
          type: "text",
          text: "The retry budget was per attempt.",
        },
      ]),
    ]);
    expect(rows.some((row) => row.startsWith("agent-message:"))).toBe(true);
    expect(rows).toContain("agent-message:The retry budget was per attempt.");
  });

  it("keeps the text that introduces tool calls as a step", () => {
    const rows = types([
      message("000F", "fix it"),
      assistant("000G", "tool_use", [
        { id: "blk_c", type: "text", text: "I'll add a bounded retry." },
        {
          id: "blk_d",
          type: "tool_use",
          toolCallId: "toolu_1",
          toolName: "bash",
          args: { command: "rg retry", description: "Searching the retry" },
        },
      ]),
    ]);
    expect(rows.some((row) => row.startsWith("agent-message:"))).toBe(false);
    expect(rows).toContain("step:I'll add a bounded retry.");
  });
});

describe("a cancelled turn's text", () => {
  it("reads as interrupted, not as a finished reply", () => {
    const events = [
      decodeEvent({
        id: id("000H"),
        jamId: "jam_edit",
        kind: "assistant",
        state: "committed",
        createdAt: "2026-11-17T09:00:09.000Z",
        payload: {
          actor: { type: "agent", jamId: "jam_edit" },
          origin: { type: "system" },
          model: {
            modelId: "anthropic/claude-sample",
            providerModelId: "claude-sample",
            reasoningMode: "medium",
          },
          route: { source: "capy" },
          usage: {
            inputTokens: 10,
            outputTokens: 20,
            cacheReadTokens: 0,
            cacheWriteTokens: 0,
          },
          stopReason: "cancelled",
          blocks: [{ id: "blk_cancelled", type: "text", text: "Half an ans" }],
        },
      }),
    ];
    const rows = buildTimeline(events, {
      liveEntries: [],
      liveSettled: false,
      expandedGroupIds: new Map(),
    }).rows.flatMap((row) => (row.type === "agent-message" ? [row] : []));
    expect(rows).toHaveLength(1);
    expect(rows[0]?.interrupted).toBe(true);
    expect(rows[0]?.settled).toBe(false);
  });
});
