import { describe, expect, it } from "vitest";
import { fixtureNow } from "./fixtures.ts";
import {
  columnWindows,
  describeWindow,
  earliestReset,
  exhaustedWindows,
  resetIn,
  usedPercent,
} from "./usage.ts";

const at = (hours: number) => new Date(fixtureNow + hours * 36e5);

describe("usage windows", () => {
  const windows = [
    {
      limiter: "weekly",
      windowMinutes: 10080,
      usedPercent: 91,
      resetsAt: at(72),
    },
    {
      limiter: "session",
      windowMinutes: 300,
      usedPercent: 42,
      resetsAt: at(2),
    },
    { limiter: "old", windowMinutes: 300, limitId: "other", usedPercent: 5 },
  ];

  it("picks the 5h and 7d columns", () => {
    const [short, long] = columnWindows(windows, "claude", fixtureNow);
    expect(short?.usedPercent).toBe(42);
    expect(long?.usedPercent).toBe(91);
  });

  it("resets windows whose reset passed", () => {
    const [short] = columnWindows(
      [{ limiter: "s", windowMinutes: 300, usedPercent: 80, resetsAt: at(-1) }],
      "claude",
      fixtureNow,
    );
    expect(short?.usedPercent).toBe(0);
    expect(short?.resetsAt).toBeUndefined();
  });

  it("formats resets and percentages", () => {
    expect(earliestReset(columnWindows(windows, "claude", fixtureNow))).toEqual(
      at(2),
    );
    expect(resetIn(at(0.5), fixtureNow)).toBe("30m");
    expect(resetIn(at(5), fixtureNow)).toBe("5h");
    expect(usedPercent({ limiter: "x", usedPercent: 120 })).toBe(100);
    expect(usedPercent(undefined)).toBeUndefined();
    expect(describeWindow(windows[0] as never, fixtureNow).label).toBe(
      "Weekly",
    );
    expect(
      describeWindow(
        { limiter: "s", windowMinutes: 300, usedPercent: 1 },
        fixtureNow,
      ).label,
    ).toBe("5 hr");
  });

  it("finds windows at the usage cap", () => {
    expect(exhaustedWindows(windows, 90, fixtureNow)).toHaveLength(1);
    expect(exhaustedWindows(windows, undefined, fixtureNow)).toHaveLength(0);
  });
});
