import { describe, expect, it } from "vitest";
import { formatMessageStamp } from "./format";

describe("formatMessageStamp", () => {
  const now = new Date(2026, 10, 17, 15, 30).getTime();

  it("shows only the time today", () => {
    expect(formatMessageStamp(new Date(2026, 10, 17, 9, 5), now)).not.toMatch(
      /Nov|Yesterday/,
    );
  });

  it("prefixes yesterday", () => {
    expect(formatMessageStamp(new Date(2026, 10, 16, 9, 5), now)).toMatch(
      /^Yesterday /,
    );
  });

  it("shows the date for older messages", () => {
    expect(formatMessageStamp(new Date(2026, 9, 1, 9, 5), now)).toMatch(/Oct/);
    expect(formatMessageStamp(new Date(2025, 9, 1, 9, 5), now)).toMatch(/2025/);
  });
});
