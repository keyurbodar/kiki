import { describe, expect, it } from "vitest";
import { formatCredits, formatShare, resolveRange } from "./model";

describe("org usage model", () => {
  const now = new Date("2026-11-17T12:00:00.000Z");

  it("resolves the current period to the current month", () => {
    const range = resolveRange({ preset: "period" }, now, "UTC");
    expect(range.from.toISOString()).toBe("2026-11-01T00:00:00.000Z");
    expect(range.to).toBe(now);
  });

  it("resolves relative presets", () => {
    const day = resolveRange({ preset: "24h" }, now, "UTC");
    expect(now.getTime() - day.from.getTime()).toBe(86_400_000);
    const week = resolveRange({ preset: "7d" }, now, "UTC");
    expect(now.getTime() - week.from.getTime()).toBe(7 * 86_400_000);
  });

  it("resolves a custom range from date inputs", () => {
    const range = resolveRange(
      { preset: "custom", from: "2026-11-02", to: "2026-11-09" },
      now,
      "UTC",
    );
    expect(range.from.toISOString()).toBe("2026-11-02T00:00:00.000Z");
    expect(range.to.toISOString()).toBe("2026-11-09T00:00:00.000Z");
  });

  it("formats credits and shares", () => {
    expect(formatCredits(185_691_000)).toBe("$1,856.91");
    expect(formatShare(78.3, 100)).toBe("78.3%");
    expect(formatShare(1, 0)).toBe("0.0%");
  });
});
