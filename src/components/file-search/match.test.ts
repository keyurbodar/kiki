import { describe, expect, it } from "vitest";
import {
  createPathMatcher,
  matchContent,
  matchPath,
  splitHits,
  toRanges,
} from "./match";

describe("toRanges", () => {
  it("merges consecutive indices", () => {
    expect(toRanges([0, 1, 2, 5, 7, 8])).toEqual([
      { start: 0, end: 3 },
      { start: 5, end: 6 },
      { start: 7, end: 9 },
    ]);
  });
});

describe("matchPath", () => {
  it("prefers name matches and scores prefixes higher", () => {
    const prefix = matchPath("rea", "docs/readme.md");
    const inner = matchPath("rea", "src/area.ts");
    expect(prefix?.where).toBe("name");
    expect(prefix?.ranges).toEqual([{ start: 0, end: 3 }]);
    expect(prefix?.score).toBeGreaterThan(inner?.score ?? 0);
  });

  it("falls back to the full path when the query has a slash", () => {
    const match = matchPath("src/app", "src/app.tsx");
    expect(match?.where).toBe("path");
    expect(match?.ranges).toEqual([{ start: 0, end: 7 }]);
  });

  it("returns nothing for a blank query or a miss", () => {
    expect(matchPath("  ", "a.ts")).toBeUndefined();
    expect(matchPath("zz", "a.ts")).toBeUndefined();
  });
});

describe("createPathMatcher", () => {
  const paths = [
    "src/index.ts",
    "src/components/button.tsx",
    "README.md",
    "docs/guide/index.md",
  ];

  it("ranks, limits and narrows incrementally", () => {
    const match = createPathMatcher(paths);
    expect(match("index", 10).map((m) => m.path)).toEqual([
      "src/index.ts",
      "docs/guide/index.md",
    ]);
    expect(match("index.m", 10).map((m) => m.path)).toEqual([
      "docs/guide/index.md",
    ]);
    expect(match("btn", 1)).toHaveLength(1);
    expect(match("", 10)).toEqual([]);
  });
});

describe("splitHits", () => {
  it("splits text around ranges", () => {
    expect(splitHits("readme", [{ start: 1, end: 3 }])).toEqual([
      { text: "r", hit: false },
      { text: "ea", hit: true },
      { text: "dme", hit: false },
    ]);
  });
});

describe("matchContent", () => {
  it("finds every hit on matching lines and trims indentation", () => {
    const hits = matchContent(
      "todo",
      "a.ts",
      "one\n    // TODO fix todo\nTwo",
      5,
    );
    expect(hits).toEqual([
      {
        path: "a.ts",
        lineNumber: 2,
        lineText: "// TODO fix todo",
        ranges: [
          { start: 3, end: 7 },
          { start: 12, end: 16 },
        ],
      },
    ]);
  });
});
