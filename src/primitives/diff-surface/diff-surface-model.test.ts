import { describe, expect, it } from "vitest";
import { SAMPLE_PATCH } from "./diff-surface.fixtures";
import {
  changeLabel,
  collapsedGroupIds,
  countChanges,
  type DiffGroup,
  emptyFileDiff,
  estimateLines,
  formatBytes,
  groupLeaders,
  groupsByFile,
  isFileCollapsed,
  itemVersion,
  joinedPositions,
  orderFiles,
  parsePatch,
  patchCacheKey,
  splitPath,
  toggleInSet,
  workerPoolSize,
} from "./diff-surface-model";

const parsedFiles = () => {
  const source = parsePatch(SAMPLE_PATCH);
  if (source.kind !== "files") throw new Error(source.reason);
  return source.files;
};

const hidden = { database: true, tests: true, generated: true };

describe("parsePatch", () => {
  it("parses every file in a unified patch", () => {
    const files = parsedFiles();
    expect(files.map((file) => file.name)).toEqual([
      "src/app/main.ts",
      "README.md",
    ]);
    expect(files[1]?.type).toBe("new");
  });

  it("falls back to raw text when nothing parses", () => {
    expect(parsePatch("  not a patch  ")).toEqual({
      kind: "raw",
      text: "not a patch",
      reason: "Unsupported patch format, showing raw text",
    });
  });
});

it("derives a stable cache key from the patch text", () => {
  expect(patchCacheKey("abc")).toBe(patchCacheKey("abc"));
  expect(patchCacheKey("abc")).not.toBe(patchCacheKey("abd"));
  expect(patchCacheKey("abc")).toMatch(/^capy-diff:3:[0-9a-z]+:[0-9a-z]+$/);
});

it("counts additions and deletions across hunks", () => {
  const [main, readme] = parsedFiles();
  expect(main && countChanges(main)).toEqual({ additions: 2, deletions: 1 });
  expect(readme && countChanges(readme)).toEqual({
    additions: 2,
    deletions: 0,
  });
});

it("splits a path into its base name and directory", () => {
  expect(splitPath("src/app/main.ts")).toEqual(["main.ts", "src/app/"]);
  expect(splitPath("README.md")).toEqual(["README.md", undefined]);
});

it("labels added, deleted and renamed files", () => {
  const file = (type: "new" | "deleted" | "rename-pure" | "change") => ({
    ...emptyFileDiff({ path: "a", kind: "modified" }),
    type,
  });
  expect(changeLabel(file("new"))).toBe("added");
  expect(changeLabel(file("deleted"))).toBe("deleted");
  expect(changeLabel(file("rename-pure"))).toBe("renamed");
  expect(changeLabel(file("change"))).toBeUndefined();
});

it("formats byte sizes the way Capy does", () => {
  expect(formatBytes(512)).toBe("512 B");
  expect(formatBytes(1536)).toBe("1.5 KB");
  expect(formatBytes(20 * 1024 * 1024)).toBe("20 MB");
  expect(formatBytes(-1)).toBe("—");
});

it("estimates skeleton lines from the hunks", () => {
  const [main] = parsedFiles();
  if (main === undefined) throw new Error("missing file");
  expect(estimateLines(main, false, false).lines).toBe(main.unifiedLineCount);
  expect(estimateLines(main, true, false).lines).toBe(main.splitLineCount);
});

it("builds an empty stand-in diff for a changed file", () => {
  expect(
    emptyFileDiff({ path: "b.ts", previousPath: "a.ts", kind: "modified" }),
  ).toMatchObject({
    name: "b.ts",
    prevName: "a.ts",
    type: "rename-changed",
    isPartial: true,
  });
  expect(emptyFileDiff({ path: "c.ts", kind: "deleted" }).type).toBe("deleted");
});

describe("category groups", () => {
  const groups: DiffGroup[] = [
    {
      id: "tests",
      category: "tests",
      filePaths: ["a.test.ts", "b.test.ts", "c.test.ts"],
    },
    { id: "plain", filePaths: ["x.ts"] },
  ];
  const files = ["x.ts", "a.test.ts", "b.test.ts", "c.test.ts"].map((path) =>
    emptyFileDiff({ path, kind: "modified" }),
  );

  it("maps files to categorised groups only when cards are on", () => {
    expect(groupsByFile(groups, false).size).toBe(0);
    const byFile = groupsByFile(groups, true);
    expect(byFile.get("b.test.ts")?.id).toBe("tests");
    expect(byFile.has("x.ts")).toBe(false);
  });

  it("collapses hidden categories unless the user expanded them", () => {
    expect(collapsedGroupIds(groups, {}, hidden)).toEqual(new Set(["tests"]));
    expect(collapsedGroupIds(groups, { tests: true }, hidden)).toEqual(
      new Set(),
    );
    expect(collapsedGroupIds(groups, {}, { ...hidden, tests: false })).toEqual(
      new Set(),
    );
  });

  it("orders ungrouped files first and keeps one file for a collapsed group", () => {
    const byFile = groupsByFile(groups, true);
    const collapsed = orderFiles(
      files,
      groups,
      byFile,
      new Set(["tests"]),
      hidden,
    );
    expect(collapsed.map((file) => file.name)).toEqual(["x.ts", "a.test.ts"]);
    const open = orderFiles(files, groups, byFile, new Set(), hidden);
    expect(open.map((file) => file.name)).toEqual([
      "x.ts",
      "a.test.ts",
      "b.test.ts",
      "c.test.ts",
    ]);
  });

  it("marks joined cards and group leaders", () => {
    expect([...joinedPositions(files, groups, true)]).toEqual([
      ["a.test.ts", "start"],
      ["b.test.ts", "middle"],
      ["c.test.ts", "end"],
    ]);
    expect(joinedPositions(files, groups, false).size).toBe(0);
    expect(groupLeaders(files, groups).get("a.test.ts")?.count).toBe(3);
  });
});

it("collapses binary files without annotations and toggled files", () => {
  const base = {
    name: "a",
    annotationCount: 0,
    variant: "default" as const,
    collapsedFiles: new Set<string>(),
  };
  expect(isFileCollapsed({ ...base, binary: true })).toBe(true);
  expect(isFileCollapsed({ ...base, binary: true, annotationCount: 1 })).toBe(
    false,
  );
  expect(
    isFileCollapsed({ ...base, binary: false, collapsedFiles: new Set(["a"]) }),
  ).toBe(true);
  expect(
    isFileCollapsed({
      ...base,
      binary: false,
      variant: "minimal",
      collapsedFiles: new Set(["a"]),
    }),
  ).toBe(false);
});

it("packs item state into the version number", () => {
  const base = {
    collapsed: false,
    join: undefined,
    groupCollapsed: false,
    categoryHidden: false,
    fileVersion: 0,
  };
  expect(itemVersion(base)).toBe(0);
  expect(itemVersion({ ...base, collapsed: true, join: "middle" })).toBe(5);
  expect(
    itemVersion({
      ...base,
      groupCollapsed: true,
      categoryHidden: true,
      fileVersion: 2,
    }),
  ).toBe(88);
});

it("toggles membership without mutating the set", () => {
  const set = new Set(["a"]);
  expect(toggleInSet(set, "a")).toEqual(new Set());
  expect(toggleInSet(set, "b")).toEqual(new Set(["a", "b"]));
  expect(set).toEqual(new Set(["a"]));
});

it("sizes the worker pool from the core count", () => {
  expect(workerPoolSize(undefined)).toBe(2);
  expect(workerPoolSize(8)).toBe(4);
  expect(workerPoolSize(32)).toBe(6);
});
