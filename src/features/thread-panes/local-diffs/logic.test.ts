import { describe, expect, it } from "vitest";
import { changedPathsCount, localDiffFileCount, newHunkLine } from "./logic";

describe("local diff logic", () => {
  it("counts dirty paths and rendered entries", () => {
    expect(
      changedPathsCount([{ dirtyPaths: ["a", "b"] }, { dirtyPaths: [] }]),
    ).toBe(2);
    expect(
      localDiffFileCount([
        {
          repo: ".",
          branch: null,
          entries: [{ repo: ".", path: "a", patch: null }],
        },
      ]),
    ).toBe(1);
  });

  it("finds the line a patch opens at", () => {
    expect(newHunkLine("@@ -0,0 +42,3 @@\n+one")).toBe(42);
    expect(newHunkLine(null)).toBeUndefined();
  });
});
