import { describe, expect, it } from "vitest";
import { formatBytes, formatRelativeTime, formatUsedStorage } from "./format";

describe("formatBytes", () => {
  it("formats like Capy", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(1023)).toBe("1023 B");
    expect(formatBytes(31 * 1024)).toBe("31 KB");
    expect(formatBytes(1536)).toBe("1.5 KB");
    expect(formatBytes(226 * 1024 ** 2)).toBe("226 MB");
    expect(formatBytes(10 * 1024 ** 3)).toBe("10 GB");
    expect(formatBytes(-1)).toBe("—");
  });
});

describe("formatUsedStorage", () => {
  it("floors tenths of a GB until the drive is full", () => {
    expect(formatUsedStorage(0.29 * 1024 ** 3, false)).toBe("0.2 GB");
    expect(formatUsedStorage(0.29 * 1024 ** 3, true)).toBe("0.3 GB");
    expect(formatUsedStorage(2048, false)).toBe("2.0 KB");
  });
});

describe("formatRelativeTime", () => {
  const now = Date.UTC(2026, 2, 2, 9);
  it("counts back in the largest unit", () => {
    expect(formatRelativeTime(now - 2000, { now })).toBe("just now");
    expect(formatRelativeTime(now - 44 * 60_000, { now })).toBe("44m ago");
    expect(formatRelativeTime(now - 23 * 3_600_000, { now })).toBe("23h ago");
    expect(formatRelativeTime(now - 26 * 3_600_000, { now })).toBe("1d ago");
    expect(formatRelativeTime(now + 3 * 3_600_000, { now })).toBe("in 3h");
    expect(
      formatRelativeTime(now - 9 * 86_400_000, { now, minified: true }),
    ).toBe("1w");
  });
});
