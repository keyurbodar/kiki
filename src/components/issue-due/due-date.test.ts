import { describe, expect, it } from "vitest";
import {
  addDays,
  addMonths,
  duePresets,
  dueRangeLabel,
  endOfWeek,
  isOverdue,
  isValidDay,
  monthGrid,
  orderRange,
  relativeDueLabel,
} from "./due-date";

describe("due-date", () => {
  it("validates real calendar days from year 1000", () => {
    expect(isValidDay("2026-02-28")).toBe(true);
    expect(isValidDay("2026-02-30")).toBe(false);
    expect(isValidDay("0999-12-31")).toBe(false);
    expect(isValidDay("2026-2-3")).toBe(false);
  });

  it("adds days and months across boundaries", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addMonths("2026-12", 1)).toBe("2027-01");
    expect(addMonths("2026-01", -1)).toBe("2025-12");
  });

  it("ends the week on Sunday", () => {
    expect(endOfWeek("2026-11-17")).toBe("2026-11-22");
    expect(endOfWeek("2026-11-22")).toBe("2026-11-22");
    expect(endOfWeek("9999-12-30")).toBe("9999-12-31");
  });

  it("flags only open issues past their due date", () => {
    expect(isOverdue("2026-11-16", "2026-11-17", false)).toBe(true);
    expect(isOverdue("2026-11-16", "2026-11-17", true)).toBe(false);
    expect(isOverdue("2026-11-17", "2026-11-17", false)).toBe(false);
    expect(isOverdue(undefined, "2026-11-17", false)).toBe(false);
  });

  it("names nearby days", () => {
    expect(relativeDueLabel("2026-11-17", "2026-11-17")).toBe("Today");
    expect(relativeDueLabel("2026-11-18", "2026-11-17")).toBe("Tomorrow");
    expect(relativeDueLabel("2026-11-16", "2026-11-17")).toBe("Yesterday");
    expect(relativeDueLabel("2027-03-01", "2026-11-17")).toMatch(/2027/);
    expect(relativeDueLabel("2026-12-01", "2026-11-17")).not.toMatch(/2026/);
  });

  it("lays a month out Monday first in whole weeks", () => {
    const days = monthGrid("2026-11");
    expect(days.length % 7).toBe(0);
    expect(days[0]).toBe("2026-10-26");
    expect(days).toContain("2026-11-30");
    expect(days.at(-1)).toBe("2026-12-06");
  });

  it("offers four presets that stay in range", () => {
    expect(duePresets("2026-11-17").map((preset) => preset.date)).toEqual([
      "2026-11-17",
      "2026-11-18",
      "2026-11-22",
      "2026-11-24",
    ]);
    expect(duePresets("9999-12-31").map((preset) => preset.label)).toEqual([
      "Today",
      "End of this week",
    ]);
  });

  it("orders a range picked backwards", () => {
    expect(orderRange("2026-11-20", "2026-11-10")).toEqual([
      "2026-11-10",
      "2026-11-20",
    ]);
  });

  it("labels open-ended and closed ranges", () => {
    expect(dueRangeLabel(null, null)).toBe("");
    expect(dueRangeLabel("2026-11-10", null)).toMatch(/^From /);
    expect(dueRangeLabel(null, "2026-11-10")).toMatch(/^Until /);
    expect(dueRangeLabel("2026-11-10", "2026-11-20")).toContain(" – ");
  });
});
