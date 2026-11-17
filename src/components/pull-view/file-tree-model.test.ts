import { describe, expect, it } from "vitest";
import { toDiffFiles } from "./file-tree-model";

describe("toDiffFiles", () => {
  it("reads path, status, additions and deletions, and defaults the rest", () => {
    const files = toDiffFiles({
      files: [
        { path: "src/checkout/retry.ts", additions: 14, deletions: 3 },
        {
          path: "test/checkout/retry.test.ts",
          status: "added",
          additions: 12,
        },
        { path: "README.md" },
      ],
    });

    expect(files.map((file) => file.path)).toEqual([
      "src/checkout/retry.ts",
      "test/checkout/retry.test.ts",
      "README.md",
    ]);
    expect(files[0]).toEqual({
      path: "src/checkout/retry.ts",
      status: "modified",
      additions: 14,
      deletions: 3,
    });
    expect(files[1]?.status).toBe("added");
    expect(files[2]).toEqual({
      path: "README.md",
      status: "modified",
      additions: 0,
      deletions: 0,
    });
  });

  it("drops entries without a path and survives a shapeless payload", () => {
    const files = toDiffFiles({ files: [{ additions: 2 }, { path: "a.ts" }] });

    expect(files.map((file) => file.path)).toEqual(["a.ts"]);
    expect(toDiffFiles(undefined)).toEqual([]);
    expect(toDiffFiles("nonsense")).toEqual([]);
  });
});
