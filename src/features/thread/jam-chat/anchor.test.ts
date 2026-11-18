import { describe, expect, it, vi } from "vitest";
import type { TimelineRow } from "@/data/events";
import { anchorShift, positionOf } from "./anchor";

const rows = (...ids: readonly string[]): TimelineRow[] =>
  ids.map((id) => ({ type: "agent-message", id }) as TimelineRow);

/** Content-relative tops for a run of row heights, with an optional header above them. */
const tops = (heights: readonly number[], header = 0) => {
  const out: number[] = [];
  let y = header;
  for (const height of heights) {
    out.push(y);
    y += height;
  }
  return out;
};

const topAt = (list: readonly number[]) => (index: number) => list[index] ?? 0;

describe("positionOf", () => {
  it("anchors on the last row whose top is at or above the scroller's top edge", () => {
    const list = tops([100, 100, 100]);
    const position = positionOf(rows("a", "b", "c"), 150, 100, topAt(list));
    expect(position.anchor).toEqual({ key: "b", offset: 50 });
  });

  it("counts the last row starting above the fold, not the last row fully shown", () => {
    const list = tops([100, 100, 100]);
    const position = positionOf(rows("a", "b", "c"), 150, 100, topAt(list));
    expect(position.lastVisibleKey).toBe("c");
  });

  it("stops at the first row below the fold instead of measuring the transcript", () => {
    const list = tops([100, 100, 100, 100, 100, 100]);
    const read = vi.fn(topAt(list));
    positionOf(rows("a", "b", "c", "d", "e", "f"), 0, 250, read);
    expect(read).toHaveBeenCalledTimes(4);
  });

  it("has no anchor while the content still starts below the scroller's top edge", () => {
    const list = tops([100, 100], 40);
    const position = positionOf(rows("a", "b"), 0, 200, topAt(list));
    expect(position.anchor).toBeNull();
    expect(position.lastVisibleKey).toBe("b");
  });
});

describe("anchorShift", () => {
  it("numbers the movement a taller row above the anchor adds", () => {
    const before = tops([100, 100, 100]);
    const after = tops([130, 100, 100]);
    const anchor = { key: "b", offset: 0 };
    expect(anchorShift(anchor, rows("a", "b", "c"), 100, topAt(after))).toBe(
      30,
    );
    expect(
      anchorShift(
        { key: "b", offset: 0 },
        rows("a", "b", "c"),
        100,
        topAt(before),
      ),
    ).toBe(0);
  });

  it("numbers a row prepended above the viewport by that row's height", () => {
    const list = tops([80, 100, 100]);
    const anchor = { key: "a", offset: 20 };
    expect(anchorShift(anchor, rows("old", "a", "b"), 0, topAt(list))).toBe(
      100,
    );
  });

  it("returns null once the anchored row is gone", () => {
    const list = tops([100, 100]);
    expect(
      anchorShift({ key: "b", offset: 0 }, rows("a", "c"), 0, topAt(list)),
    ).toBeNull();
  });
});
