import { Schema } from "effect";
import { describe, expect, it } from "vitest";
import { EventRow } from "@/data/events";
import { pendingMessageEvent, pendingRows, withoutAnswered } from "./pending";

const decodeEvent = Schema.decodeUnknownSync(EventRow);

const jamId = "jam_sample_0002" as never;
const at = new Date("2026-11-18T05:45:00.000Z");

const sent = (clientKey: string, text = "check the timeout") =>
  pendingMessageEvent(
    jamId,
    {
      clientKey,
      text,
      mentions: [],
      delivery: "steer",
      userId: "user_sample" as never,
    },
    at,
  );

const stored = (clientKey: string, text = "check the timeout"): EventRow =>
  decodeEvent({
    id: "01M7PK3X2N00000000000000W5",
    jamId: "jam_sample_0002",
    kind: "message",
    state: "pending",
    createdAt: "2026-11-18T05:45:01.000Z",
    payload: {
      actor: { type: "user", userId: "user_sample" },
      origin: { type: "web", userId: "user_sample" },
      text,
      files: [],
      delivery: "steer",
      clientKey,
    },
  });

const payloadOf = (row: EventRow) => {
  if (row.kind !== "message") throw new Error(`not a message row: ${row.kind}`);
  return row.payload;
};

describe("pendingMessageEvent", () => {
  it("builds the row a send shows: the viewer's own text, at the gesture's delivery", () => {
    const row = sent("ck_1");
    expect(row.kind).toBe("message");
    expect(row.state).toBe("pending");
    expect(row.id).toHaveLength(26);
    expect(row.createdAt).toEqual(at);
    expect(payloadOf(row)).toMatchObject({
      actor: { type: "user", userId: "user_sample" },
      origin: { type: "web", userId: "user_sample" },
      text: "check the timeout",
      files: [],
      delivery: "steer",
      clientKey: "ck_1",
    });
  });

  it("keeps the mention kinds a stored message carries", () => {
    const row = pendingMessageEvent(
      jamId,
      {
        clientKey: "ck_2",
        text: "see ./retry.ts",
        delivery: "steer",
        userId: "user_sample" as never,
        mentions: [
          {
            kind: "file",
            id: "src/retry.ts",
            label: "retry.ts",
            start: 4,
            end: 14,
            text: "./retry.ts",
          },
          {
            kind: "captain",
            id: "cap_sample",
            label: "Yuzu",
            start: 0,
            end: 3,
            text: "@Yu",
          },
        ],
      },
      at,
    );
    expect(payloadOf(row).mentions?.map((mention) => mention.kind)).toEqual([
      "file",
    ]);
  });

  it("sorts after the ids stored before it", () => {
    expect(sent("ck_3").id > "01M7MBRP500300000000000004").toBe(true);
  });
});

describe("pendingRows", () => {
  it("draws a pending row the store has not answered", () => {
    const rows = pendingRows({ events: [], pending: [sent("ck_1")] });
    expect(rows).toHaveLength(1);
  });

  it("drops it once a stored row carries the same client key", () => {
    const rows = pendingRows({
      events: [stored("ck_1")],
      pending: [sent("ck_1")],
    });
    expect(rows).toEqual([]);
  });

  it("keeps a later send whose client key is still unanswered", () => {
    const rows = pendingRows({
      events: [stored("ck_1")],
      pending: [sent("ck_1"), sent("ck_2", "and the staging one")],
    });
    expect(
      rows.map((row) => row.kind === "message" && row.payload.text),
    ).toEqual(["and the staging one"]);
  });

  it("leaves the array alone when nothing answered it", () => {
    const pending = [sent("ck_1")];
    expect(withoutAnswered(pending, [stored("ck_9")])).toBe(pending);
  });
});
