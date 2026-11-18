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
