import { expect, it } from "vitest";
import type { TimelineRow } from "@/data/events";
import { computeRowGaps, countMessagesBelow, rowKey } from "./row-gaps";

const MINUTE = 60_000;
const t0 = new Date(2026, 0, 5, 9, 0).getTime();
const at = (minutes: number) => new Date(t0 + minutes * MINUTE);

const user = (id: string, minutes: number, clientKey?: string) =>
  ({
    id,
    type: "user-message",
    createdAt: at(minutes),
    actor: { type: "user", userId: "user_1" },
    origin: { type: "web" },
    clientKey,
  }) as unknown as TimelineRow;
const agent = (id: string, minutes: number) =>
  ({
    id,
    type: "agent-message",
    createdAt: at(minutes),
  }) as unknown as TimelineRow;
const work = (id: string, minutes: number) =>
  ({
    id,
    type: "work-group",
    createdAt: at(minutes),
  }) as unknown as TimelineRow;
const marker = (id: string, minutes: number) =>
  ({ id, type: "marker", createdAt: at(minutes) }) as unknown as TimelineRow;

it("keys optimistic user messages by client key", () => {
  expect(rowKey(user("u1", 0, "ck1"))).toBe("client:ck1");
  expect(rowKey(user("u1", 0))).toBe("u1");
});

it("stamps the first row and turns that start an hour later", () => {
  const rows = [user("u1", 0), work("w1", 1), agent("a1", 2), user("u2", 70)];
  const gaps = computeRowGaps(rows);
  expect(gaps.get("u1")).toEqual({ gap: "lead", stamp: at(0) });
  expect(gaps.get("u2")).toEqual({ gap: "stamp", stamp: at(70) });
});

it("spaces speaker changes wider than runs from one speaker", () => {
  const gaps = computeRowGaps([
    user("u1", 0),
    agent("a1", 1),
    agent("a2", 2),
    work("w1", 3),
  ]);
  expect(gaps.get("a1")?.gap).toBe("turn");
  expect(gaps.get("a2")?.gap).toBe("same");
  expect(gaps.get("w1")?.gap).toBe("tight");
});

it("spaces a message after a work group like any other row", () => {
  const gaps = computeRowGaps([user("u1", 0), work("w1", 1), agent("a1", 2)]);
  expect(gaps.get("a1")?.gap).toBe("tight");
});

it("only stamps above a message the user sent", () => {
  const rows = [user("u1", 0), work("w1", 1), agent("a1", 70), user("u2", 140)];
  const gaps = computeRowGaps(rows);
  expect(gaps.get("a1")).toEqual({ gap: "tight", stamp: undefined });
  expect(gaps.get("u2")).toEqual({ gap: "stamp", stamp: at(140) });
});

it("keeps rows around markers tight", () => {
  const gaps = computeRowGaps([user("u1", 0), marker("m1", 1), agent("a1", 2)]);
  expect(gaps.get("m1")?.gap).toBe("tight");
  expect(gaps.get("a1")?.gap).toBe("tight");
});

it("counts messages below the last visible row", () => {
  const rows = [user("u1", 0), work("w1", 1), agent("a1", 2), user("u2", 3)];
  expect(countMessagesBelow(rows, "u1")).toBe(2);
  expect(countMessagesBelow(rows, "u2")).toBe(0);
  expect(countMessagesBelow(rows, null)).toBe(0);
});
