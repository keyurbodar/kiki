import { describe, expect, it } from "vitest";
import { formatDuration, formatRelative } from "./relative-time";

const now = Date.UTC(2026, 10, 17, 12, 0, 0);
const ago = (ms: number) => now - ms;

describe("formatRelative", () => {
  it("matches Capy's buckets", () => {
    expect(formatRelative(ago(2_000), { now })).toBe("just now");
    expect(formatRelative(ago(42_000), { now })).toBe("42s ago");
    expect(formatRelative(ago(23 * 60_000), { now })).toBe("23m ago");
    expect(formatRelative(ago(22 * 3_600_000), { now })).toBe("22h ago");
    expect(formatRelative(ago(3 * 86_400_000), { now })).toBe("3d ago");
    expect(formatRelative(ago(15 * 86_400_000), { now })).toBe("2w ago");
    expect(formatRelative(ago(400 * 86_400_000), { now })).toBe("1y ago");
  });

  it("handles the future and the minified form", () => {
    expect(formatRelative(now + 2 * 86_400_000, { now })).toBe("in 2d");
    expect(formatRelative(ago(5 * 60_000), { now, minified: true })).toBe("5m");
    expect(formatRelative(ago(1_000), { now, minified: true })).toBe("now");
  });
});

describe("formatDuration", () => {
  it("formats milliseconds, seconds and minutes", () => {
    expect(formatDuration(850)).toBe("850ms");
    expect(formatDuration(12_400)).toBe("12s");
    expect(formatDuration(243_000)).toBe("4m 3s");
    expect(formatDuration(120_000)).toBe("2m");
  });
});
