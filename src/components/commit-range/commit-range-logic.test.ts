import { describe, expect, it } from "vitest";
import {
  commitSubject,
  nextCell,
  radioCell,
  rangeRows,
  scopeForCommit,
  scopeForRange,
  scopeLabel,
  shortSha,
} from "./commit-range-logic";

const commits = [
  { sha: "aaaaaaaa1111", message: "one\nbody" },
  { sha: "bbbbbbbb2222", message: "two" },
  { sha: "cccccccc3333", message: "three" },
];
const pull = {
  baseSha: "base000",
  headSha: commits[2]?.sha ?? "",
  baseRef: "main",
};

describe("commit ranges", () => {
  it("resolves rows from shas and tracks the whole-pull scope", () => {
    expect(rangeRows(commits, null)).toEqual({ from: 0, to: 3 });
    expect(rangeRows(commits, { from: null, to: "bbbbbbbb2222" })).toEqual({
      from: 1,
      to: 2,
    });
    expect(scopeForRange(pull, commits, 0, 3)).toBeNull();
    expect(scopeForRange(pull, commits, 1, 3)).toEqual({
      from: "aaaaaaaa1111",
      to: "cccccccc3333",
    });
    expect(scopeForCommit(commits, 3)).toEqual({
      from: null,
      to: "cccccccc3333",
    });
    expect(scopeLabel(commits, { from: null, to: "cccccccc3333" })).toEqual({
      single: "ccccccc",
    });
    expect(
      scopeLabel(commits, { from: "aaaaaaaa1111", to: "cccccccc3333" }),
    ).toEqual({ from: "aaaaaaa", to: "ccccccc" });
    expect(
      scopeLabel(commits, { from: "base000", to: "cccccccc3333" }),
    ).toEqual({ from: "base", to: "ccccccc" });
  });

  it("formats commit subjects and short shas", () => {
    expect(commitSubject("one\nbody")).toBe("one");
    expect(shortSha("aaaaaaaa1111")).toBe("aaaaaaa");
  });

  it("computes radio visibility and range shading", () => {
    expect(radioCell("from", 0, 3, 1, 3)).toEqual({
      shown: true,
      on: false,
      dim: false,
      inRange: false,
    });
    expect(radioCell("from", 1, 3, 1, 3)).toEqual({
      shown: true,
      on: true,
      dim: false,
      inRange: false,
    });
    expect(radioCell("from", 2, 3, 1, 3).dim).toBe(false);
    expect(radioCell("from", 3, 3, 1, 3).dim).toBe(true);
    expect(radioCell("to", 2, 3, 1, 3).inRange).toBe(true);
    expect(radioCell("to", 3, 3, 1, 3).on).toBe(true);
  });

  it("moves with arrow keys to the nearest enabled cell", () => {
    const cells = [
      { column: 0, row: 1 },
      { column: 0, row: 2 },
      { column: 1, row: 3 },
    ];
    expect(nextCell("ArrowDown", { column: 0, row: 1 }, cells)).toEqual(
      cells[1],
    );
    expect(nextCell("ArrowLeft", { column: 1, row: 3 }, cells)).toBeUndefined();
    expect(nextCell("Unknown", { column: 1, row: 3 }, cells)).toBeUndefined();
  });
});
