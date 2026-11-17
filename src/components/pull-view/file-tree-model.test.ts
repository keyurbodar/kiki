import { describe, expect, it } from "vitest";
import { buildFileTree, filterFiles, toDiffFiles } from "./file-tree-model";

const files = toDiffFiles({
  files: [
    { path: "src/checkout/retry.ts", additions: 14, deletions: 3 },
    { path: "src/checkout/gateway.ts", additions: 3, deletions: 1 },
    { path: "test/checkout/retry.test.ts", status: "added", additions: 12 },
    { path: "README.md" },
  ],
});

describe("buildFileTree", () => {
  it("compacts single-child folders and sorts folders first", () => {
    const tree = buildFileTree(files);
    expect(tree.map((node) => node.name)).toEqual([
      "src / checkout",
      "test / checkout",
      "README.md",
    ]);
    const [src] = tree;
    expect(
      src?.kind === "dir" && src.children.map((node) => node.name),
    ).toEqual(["gateway.ts", "retry.ts"]);
  });

  it("filters by path", () => {
    expect(filterFiles(files, "RETRY").map((file) => file.path)).toEqual([
      "src/checkout/retry.ts",
      "test/checkout/retry.test.ts",
    ]);
    expect(filterFiles(files, " ")).toHaveLength(4);
  });
});
