import { describe, expect, it } from "vitest";
import { searchDrivePaths } from "./drive-search";

const paths = [
  "notes/release-checklist.md",
  "notes/release.md",
  "skills/deploy/SKILL.md",
  "archive/2025/release-notes.md",
  "README.md",
];

describe("drive search", () => {
  it("matches names and paths without case", () => {
    expect(searchDrivePaths(paths, "RELEASE")).toEqual([
      "notes/release.md",
      "notes/release-checklist.md",
      "archive/2025/release-notes.md",
    ]);
  });

  it("puts a file-name hit above a folder hit", () => {
    expect(searchDrivePaths(paths, "deploy")[0]).toBe("skills/deploy/SKILL.md");
  });

  it("returns nothing for a blank query", () => {
    expect(searchDrivePaths(paths, "   ")).toEqual([]);
  });

  it("stops at the result limit", () => {
    expect(searchDrivePaths(paths, "e", 2)).toHaveLength(2);
  });
});
