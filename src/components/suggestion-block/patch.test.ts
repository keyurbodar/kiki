import { describe, expect, it } from "vitest";
import {
  anchorRows,
  buildPatch,
  originalLines,
  parseHunkRows,
  suggestionRows,
} from "./patch";

const patch = "--- a/x\n+++ b/x\n@@ -10,3 +10,4 @@\n a\n-b\n+c\n+d\n \n e";

describe("parseHunkRows", () => {
  it("numbers old and new lines", () => {
    expect(parseHunkRows(patch)).toEqual([
      { marker: " ", text: "a", oldNo: 10, newNo: 10 },
      { marker: "-", text: "b", oldNo: 11, newNo: 10 },
      { marker: "+", text: "c", oldNo: 11, newNo: 11 },
      { marker: "+", text: "d", oldNo: 11, newNo: 12 },
      { marker: " ", text: "", oldNo: 12, newNo: 13 },
      { marker: " ", text: "e", oldNo: 13, newNo: 14 },
    ]);
  });

  it("reads the original lines of a range only when complete", () => {
    const rows = parseHunkRows(patch);
    expect(originalLines(rows, 11, 12)).toEqual(["c", "d"]);
    expect(originalLines(rows, 13, 20)).toBeNull();
  });

  it("takes up to three lines before the anchor line and trims leading blanks", () => {
    const rows = parseHunkRows(patch);
    expect(anchorRows(rows, 14).map((row) => row.text)).toEqual([
      "c",
      "d",
      "",
      "e",
    ]);
    expect(anchorRows(rows, 99)).toEqual([]);
  });
});

describe("suggestion patches", () => {
  it("replaces the original lines with the suggestion", () => {
    const rows = suggestionRows("x\ny", ["c"], 11);
    expect(
      rows.map((row) => `${row.marker}${row.text}:${row.oldNo}/${row.newNo}`),
    ).toEqual(["-c:11/10", "+x:11/11", "+y:11/12"]);
    expect(buildPatch("f.ts", rows)).toBe(
      "diff --git a/f.ts b/f.ts\n--- a/f.ts\n+++ b/f.ts\n@@ -11,1 +11,2 @@\n-c\n+x\n+y\n",
    );
    expect(buildPatch("f.ts", [])).toBeNull();
  });
});
