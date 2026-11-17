import { describe, expect, it } from "vitest";
import { formatRelativeTime } from "./relative-time";

const now = Date.UTC(2026, 0, 10);
const ago = (ms: number) => now - ms;

describe("formatRelativeTime", () => {
  it("says just now under five seconds", () => {
    expect(formatRelativeTime(ago(4000), { now })).toBe("just now");
    expect(formatRelativeTime(ago(4000), { now, minified: true })).toBe("now");
  });

  it("picks the largest whole unit", () => {
    expect(formatRelativeTime(ago(30_000), { now })).toBe("30s ago");
    expect(formatRelativeTime(ago(5 * 60_000), { now })).toBe("5m ago");
    expect(formatRelativeTime(ago(3 * 3_600_000), { now })).toBe("3h ago");
    expect(formatRelativeTime(ago(2 * 86_400_000), { now })).toBe("2d ago");
    expect(formatRelativeTime(ago(15 * 86_400_000), { now })).toBe("2w ago");
    expect(formatRelativeTime(ago(800 * 86_400_000), { now })).toBe("2y ago");
  });

  it("handles future times and Date values", () => {
    expect(formatRelativeTime(now + 120_000, { now })).toBe("in 2m");
    expect(formatRelativeTime(new Date(ago(60_000)), { now })).toBe("1m ago");
    expect(formatRelativeTime(ago(60_000), { now, minified: true })).toBe("1m");
  });
});
