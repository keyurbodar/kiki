import { describe, expect, it } from "@effect/vitest";
import {
  decodeAutomationUsage,
  formatDay,
  formatSpend,
  usageCaption,
} from "./usage";

describe("automation usage", () => {
  it("reads totals, spend and the sorted daily series", () => {
    const usage = decodeAutomationUsage({
      totalRuns: 14,
      credits: 0,
      series: [
        { start: "2026-11-02T00:00:00.000Z", runs: 2, credits: 0 },
        { start: "2026-11-01T00:00:00.000Z", runs: 1, credits: 0 },
      ],
    });
    expect(usage.runs).toBe(14);
    expect(usage.credits).toBe(0);
    expect(usage.points.map((point) => point.runs)).toEqual([1, 2]);
  });

  it("falls back to an empty summary for a payload it cannot read", () => {
    expect(decodeAutomationUsage(null)).toEqual({
      runs: 0,
      credits: 0,
      points: [],
    });
    expect(decodeAutomationUsage({ totalRuns: "many" }).runs).toBe(0);
  });

  it("prints spend and the run caption as Capy does", () => {
    expect(formatSpend(0)).toBe("$0");
    expect(formatSpend(1.2)).toBe("$1.20");
    expect(usageCaption(0)).toBe("0 runs in the last 30 days");
    expect(usageCaption(1)).toBe("1 run in the last 30 days");
    expect(formatDay("not a date")).toBe("not a date");
  });
});
