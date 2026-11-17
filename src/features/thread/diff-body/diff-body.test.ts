import { describe, expect, it } from "vitest";
import { diffStartLine } from "./diff-body";

describe("diffStartLine", () => {
  it("reads the new-file start line of the first hunk", () => {
    expect(diffStartLine("--- a/a.ts\n+++ b/a.ts\n@@ -1,3 +12,4 @@\n")).toBe(
      12,
    );
  });

  it("has no line for a new empty file", () => {
    expect(diffStartLine("@@ -0,0 +1,2 @@\n+one")).toBe(1);
    expect(diffStartLine("no hunk")).toBeUndefined();
  });
});
