import { describe, expect, it } from "vitest";
import {
  addDays,
  dayBuckets,
  dayMs,
  formatAgentHours,
  hourMs,
  isoDate,
  niceTicks,
  percentOf,
  resolveRange,
  seriesForRange,
  startOfDay,
  validateActivitySearch,
} from "./activity-range";

const now = new Date("2026-03-15T15:30:00.000Z");

describe("validateActivitySearch", () => {
  it("keeps known values and drops the rest", () => {
    expect(
      validateActivitySearch({
        preset: "7d",
        from: "2026-03-01",
        to: "nope",
        project: "proj_a",
        member: ["", "user_a", 3],
        machine: "device",
      }),
    ).toEqual({
      preset: "7d",
      from: "2026-03-01",
      to: undefined,
      project: ["proj_a"],
      member: ["user_a"],
      machine: "device",
    });
    expect(validateActivitySearch({ preset: "1y", machine: "phone" })).toEqual({
      preset: undefined,
      from: undefined,
      to: undefined,
      project: undefined,
      member: undefined,
      machine: undefined,
    });
  });
});

describe("day math", () => {
  it("finds the start of the day in a zone", () => {
    expect(new Date(startOfDay(now.getTime(), "UTC")).toISOString()).toBe(
      "2026-03-15T00:00:00.000Z",
    );
    expect(
      new Date(startOfDay(now.getTime(), "Asia/Kolkata")).toISOString(),
    ).toBe("2026-03-14T18:30:00.000Z");
  });

  it("adds calendar days across a DST change", () => {
    const start = startOfDay(
      Date.parse("2026-03-07T12:00:00Z"),
      "America/New_York",
    );
    const next = addDays(start, 2, "America/New_York");
    expect(isoDate(next, "America/New_York")).toBe("2026-03-09");
    expect(next - start).toBe(2 * dayMs - hourMs);
  });
});

describe("resolveRange", () => {
  it("defaults to 30 days ending now", () => {
    const range = resolveRange({}, now, "UTC");
    expect(range.preset).toBe("30d");
    expect(range.to).toEqual(now);
    expect(range.from.toISOString()).toBe("2026-02-14T00:00:00.000Z");
    expect(dayBuckets(range)).toHaveLength(30);
  });

  it("uses a rolling window for 24h", () => {
    const range = resolveRange({ preset: "24h" }, now, "UTC");
    expect(range.to.getTime() - range.from.getTime()).toBe(dayMs);
  });

  it("covers whole days for a custom range, in either order", () => {
    const range = resolveRange(
      { preset: "custom", from: "2026-03-10", to: "2026-03-03" },
      now,
      "UTC",
    );
    expect(range.from.toISOString()).toBe("2026-03-03T00:00:00.000Z");
    expect(range.to.toISOString()).toBe("2026-03-11T00:00:00.000Z");
    expect(dayBuckets(range)).toHaveLength(8);
  });

  it("falls back to 30 days for a custom preset without dates", () => {
    expect(resolveRange({ preset: "custom" }, now, "UTC").preset).toBe("30d");
  });
});

describe("seriesForRange", () => {
  it("places rows on their day and fills gaps with zero", () => {
    const range = resolveRange({ preset: "7d" }, now, "UTC");
    const rows = [
      { at: Date.parse("2026-03-15T08:00:00Z"), value: 4 },
      { at: Date.parse("2026-03-10T23:00:00Z"), value: 2 },
    ];
    expect(
      seriesForRange(
        rows,
        range,
        (row) => row.at,
        (row) => row.value,
      ),
    ).toEqual([0, 2, 0, 0, 0, 0, 4]);
  });
});

describe("formatting", () => {
  it("picks round axis ticks", () => {
    expect(niceTicks(0)).toEqual([0, 1]);
    expect(niceTicks(7)).toEqual([0, 2, 4, 6, 8]);
    expect(niceTicks(113)).toEqual([0, 50, 100, 150]);
  });

  it("formats agent hours like Capy", () => {
    expect(formatAgentHours(0)).toBe("0h");
    expect(formatAgentHours(25 * 60_000)).toBe("25m");
    expect(formatAgentHours(2.4 * hourMs)).toBe("2.4h");
    expect(formatAgentHours(88 * hourMs)).toBe("88h");
  });

  it("rounds a share and has none for an empty whole", () => {
    expect(percentOf(113, 114)).toBe(99);
    expect(percentOf(1, 0)).toBeUndefined();
  });
});
