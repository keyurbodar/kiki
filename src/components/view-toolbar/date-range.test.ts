import { describe, expect, it } from "vitest";
import {
  customDateBounds,
  dateRangeBounds,
  dateRangeLabel,
  matchesDateRange,
} from "./date-range";

const now = new Date(2026, 10, 17, 15, 30).getTime();
const daysAgo = (days: number) => new Date(now - days * 864e5);

describe("date ranges", () => {
  it("labels presets and custom ranges", () => {
    expect(dateRangeLabel("week", now)).toBe("Last week");
    expect(
      dateRangeLabel(
        { kind: "custom", from: "2026-11-01", to: "2026-11-01" },
        now,
      ),
    ).toBe("Nov 1");
    expect(
      dateRangeLabel(
        { kind: "custom", from: "2026-11-09", to: "2025-12-01" },
        now,
      ),
    ).toBe("Dec 1, 2025 to Nov 9");
  });

  it("matches presets against now", () => {
    expect(matchesDateRange(daysAgo(0.1), "today", now)).toBe(true);
    expect(matchesDateRange(daysAgo(3), "week", now)).toBe(true);
    expect(matchesDateRange(daysAgo(8), "week", now)).toBe(false);
    expect(matchesDateRange(daysAgo(29), "month", now)).toBe(true);
    expect(matchesDateRange(daysAgo(31), "older", now)).toBe(true);
  });

  it("matches inclusive custom days in either order", () => {
    const range = {
      kind: "custom" as const,
      from: "2026-11-10",
      to: "2026-11-05",
    };
    expect(matchesDateRange(new Date(2026, 10, 10, 23), range, now)).toBe(true);
    expect(matchesDateRange(new Date(2026, 10, 11, 0, 1), range, now)).toBe(
      false,
    );
    expect(customDateBounds("bad", "2026-11-01")).toBeUndefined();
  });

  it("turns ranges into query bounds floored to the hour", () => {
    const week = dateRangeBounds("week", now);
    expect(week.after?.getTime()).toBe(new Date(2026, 10, 10, 15).getTime());
    expect(dateRangeBounds("older", now).before).toBeDefined();
  });
});
