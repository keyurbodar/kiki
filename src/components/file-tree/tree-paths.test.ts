import { describe, expect, it } from "vitest";
import {
  ancestorFoldersOf,
  deepestKnownFolder,
  filterPaths,
  folderPathsOf,
  statDecoration,
} from "./tree-paths";

describe("tree paths", () => {
  it("collects every folder of a path list", () => {
    expect([...folderPathsOf(["a/b/c.ts", "a/d.ts", "e.ts"])].sort()).toEqual([
      "a",
      "a/b",
    ]);
  });

  it("lists ancestors and the deepest known one", () => {
    expect(ancestorFoldersOf("a/b/c")).toEqual(["a", "a/b", "a/b/c"]);
    expect(ancestorFoldersOf("")).toEqual([]);
    expect(deepestKnownFolder(new Set(["a", "a/b"]), "a/b/c")).toBe("a/b");
    expect(deepestKnownFolder(new Set(), "a/b")).toBe("");
  });

  it("filters case-insensitively and normalises backslashes", () => {
    expect(filterPaths(["src/App.tsx", "docs/a.md"], "SRC\\app")).toEqual([
      "src/App.tsx",
    ]);
    expect(filterPaths(["a"], " ")).toEqual(["a"]);
  });

  it("formats diff stats", () => {
    expect(statDecoration({ additions: 3, deletions: 1 })).toEqual({
      text: "+3 -1",
      title: "3 additions, 1 deletions",
      parts: [
        { text: "+3", color: "var(--diff-add)" },
        { text: "-1", color: "var(--diff-del)" },
      ],
    });
    expect(statDecoration({ additions: 0 })).toBeNull();
  });
});
