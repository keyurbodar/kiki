import { describe, expect, it } from "vitest";
import {
  compactAtHint,
  compactAtRangeError,
  formatTokens,
  parseCompactAt,
} from "./compact-at";

describe("parseCompactAt", () => {
  it("treats blank input as empty and accepts comma-formatted values", () => {
    expect(parseCompactAt("", 200_000)).toEqual({ kind: "empty" });
    expect(parseCompactAt("   ", 200_000)).toEqual({ kind: "empty" });
    expect(parseCompactAt("160,000", 200_000)).toEqual({
      kind: "ok",
      tokens: 160_000,
    });
    expect(parseCompactAt("50000", 200_000)).toEqual({
      kind: "ok",
      tokens: 50_000,
    });
  });

  it("rejects out-of-range and fractional values with the range message", () => {
    const message = "Enter between 50,000 and 200,000 tokens";
    expect(parseCompactAt("49999", 200_000)).toEqual({
      kind: "invalid",
      message,
    });
    expect(parseCompactAt("200,001", 200_000)).toEqual({
      kind: "invalid",
      message,
    });
    expect(parseCompactAt("1.5", 200_000)).toEqual({
      kind: "invalid",
      message,
    });
  });
});

describe("compactAtHint and helpers", () => {
  it("describes the default and the window limit", () => {
    expect(formatTokens(160_000)).toBe("160,000");
    expect(compactAtRangeError(200_000)).toBe(
      "Enter between 50,000 and 200,000 tokens",
    );
    expect(compactAtHint(160_000, 200_000)).toBe(
      "Default is 160,000, up to 200,000 tokens",
    );
  });
});
