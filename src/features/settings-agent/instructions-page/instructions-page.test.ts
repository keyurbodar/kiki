import { describe, expect, it } from "vitest";
import { firstLine } from "./instructions-page";

describe("firstLine", () => {
  it("strips markdown markers from the first real line", () => {
    expect(firstLine("# Release rules\n\nShip on Tuesdays")).toBe(
      "Release rules",
    );
    expect(firstLine("\n> - Quote first")).toBe("Quote first");
  });

  it("skips rules and blank lines, and is undefined for empty text", () => {
    expect(firstLine("---\n\n* Keep PRs small")).toBe("Keep PRs small");
    expect(firstLine("  \n\n")).toBeUndefined();
  });
});
