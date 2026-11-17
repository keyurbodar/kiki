import { describe, expect, it } from "vitest";
import { segmentFill, usageBar } from "./usage-bar";

const gib = 1024 ** 3;

describe("usageBar", () => {
  it("labels usage against the limit", () => {
    const bar = usageBar({ usedBytes: 0.25 * gib, limitBytes: 10 * gib }, []);
    expect(bar.label).toBe("0.2 GB of 10 GB");
    expect(bar.full).toBe(false);
    expect(bar.nearlyFull).toBe(false);
  });

  it("drops segments under the minimum share and fills the rest", () => {
    const bar = usageBar({ usedBytes: 6 * gib, limitBytes: 10 * gib }, [
      { key: "a", bytes: 4 * gib },
      { key: "tiny", bytes: 1024 },
    ]);
    expect(bar.visible.map((segment) => segment.key)).toEqual(["a"]);
    expect(bar.width(4 * gib)).toBe("40%");
    expect(bar.restBytes).toBe(2 * gib);
  });

  it("scales segments down when they outgrow the used total", () => {
    const bar = usageBar({ usedBytes: 2 * gib, limitBytes: 10 * gib }, [
      { key: "a", bytes: 2 * gib },
      { key: "b", bytes: 2 * gib },
    ]);
    expect(bar.scale).toBe(0.5);
    expect(bar.restBytes).toBe(0);
  });

  it("warns at ninety percent and rounds when full", () => {
    expect(
      usageBar({ usedBytes: 9.2 * gib, limitBytes: 10 * gib }, []).nearlyFull,
    ).toBe(true);
    const full = usageBar({ usedBytes: 10.06 * gib, limitBytes: 10 * gib }, []);
    expect(full.full).toBe(true);
    expect(full.label).toBe("10.1 GB of 10 GB");
  });

  it("treats a zero limit as full", () => {
    const bar = usageBar({ usedBytes: 0, limitBytes: 0 }, []);
    expect(bar.full).toBe(true);
    expect(bar.width(0)).toBe("0%");
  });
});

describe("segmentFill", () => {
  it("cycles chart colours, then the other colour, and reds when full", () => {
    expect(segmentFill(0, false)).toBe("bg-chart-1");
    expect(segmentFill(8, false)).toBe("bg-chart-other");
    expect(segmentFill(6, true)).toBe("bg-destructive/60");
  });
});
