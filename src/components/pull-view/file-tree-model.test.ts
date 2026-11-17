import { describe, expect, it } from "vitest";
import { filterFiles, toDiffFiles } from "./file-tree-model";

const files = toDiffFiles({
  files: [
    { path: "src/checkout/retry.ts", additions: 14, deletions: 3 },
    { path: "src/checkout/gateway.ts", additions: 3, deletions: 1 },
    { path: "test/checkout/retry.test.ts", status: "added", additions: 12 },
    { path: "README.md" },
  ],
});

describe("filterFiles", () => {
  it("filters by path", () => {
    expect(filterFiles(files, "RETRY").map((file) => file.path)).toEqual([
      "src/checkout/retry.ts",
      "test/checkout/retry.test.ts",
    ]);
    expect(filterFiles(files, " ")).toHaveLength(4);
  });
});
