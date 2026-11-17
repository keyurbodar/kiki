import { describe, expect, it } from "vitest";
import {
  baseName,
  buildFileIndex,
  folderAt,
  folderEntries,
  nearestFolder,
  normalizeFilter,
  parentPath,
  siblingPath,
} from "./file-index";

const files = [
  { path: "README.md", sizeBytes: 10 },
  { path: "docs/guide.md", sizeBytes: 20 },
  { path: "docs/api/index.md", sizeBytes: 30 },
  { path: "src/lib/deep/util.ts", sizeBytes: 40 },
  { path: "src/app.ts", sizeBytes: 50 },
];

describe("buildFileIndex", () => {
  it("counts files and bytes at every level", () => {
    const index = buildFileIndex(files);
    expect(index.fileCount).toBe(5);
    expect(index.totalBytes).toBe(150);
    expect(index.files.map((file) => file.name)).toEqual(["README.md"]);
    const docs = folderAt(index, "docs");
    expect(docs?.fileCount).toBe(2);
    expect(docs?.totalBytes).toBe(50);
    expect(folderAt(index, "src/lib/deep")?.files[0]?.path).toBe(
      "src/lib/deep/util.ts",
    );
  });

  it("returns the root for an empty path and undefined for a missing one", () => {
    const index = buildFileIndex(files);
    expect(folderAt(index, "")).toBe(index);
    expect(folderAt(index, "nope")).toBeUndefined();
    expect(folderAt(index, "docs/nope")).toBeUndefined();
  });
});

describe("nearestFolder", () => {
  it("walks up to the deepest folder that still exists", () => {
    expect(nearestFolder(files, "docs/api/gone")).toBe("docs/api");
    expect(nearestFolder(files, "gone/deeper")).toBe("");
    expect(nearestFolder(files, "")).toBe("");
  });
});

describe("folderEntries", () => {
  it("lists folders first, then files, each sorted by label", () => {
    const index = buildFileIndex(files);
    expect(folderEntries(index, "").map((entry) => entry.label)).toEqual([
      "docs",
      "src",
      "README.md",
    ]);
  });

  it("collapses chains of single-folder directories", () => {
    const index = buildFileIndex(files);
    const src = folderAt(index, "src");
    if (src === undefined) throw new Error("missing src");
    expect(folderEntries(src, "src")[0]).toEqual({
      kind: "folder",
      label: "lib/deep",
      path: "src/lib/deep",
      fileCount: 1,
      totalBytes: 40,
    });
  });
});

describe("path helpers", () => {
  it("splits names and parents", () => {
    expect(baseName("a/b/c.ts")).toBe("c.ts");
    expect(baseName("c.ts")).toBe("c.ts");
    expect(parentPath("a/b/c.ts")).toBe("a/b");
    expect(parentPath("c.ts")).toBe("");
  });

  it("normalizes filters", () => {
    expect(normalizeFilter("  Src\\Lib ")).toBe("src/lib");
  });

  it("steps through siblings in the same folder", () => {
    const paths = files.map((file) => file.path);
    expect(siblingPath(paths, "src/app.ts", -1)).toBeUndefined();
    expect(siblingPath(["a/x", "a/y", "b/z"], "a/x", 1)).toBe("a/y");
    expect(siblingPath(["a/x", "a/y", "b/z"], "a/y", 1)).toBeUndefined();
  });
});
