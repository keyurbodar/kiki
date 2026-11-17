import { describe, expect, it } from "vitest";
import { cellText, parseCsv, sortKeys, sortOrder } from "./csv-grid";

const rows = (text: string, grid: ReturnType<typeof parseCsv>) =>
  Array.from({ length: grid.rows }, (_, row) =>
    Array.from({ length: grid.columns }, (_, column) =>
      cellText(text, grid, row, column),
    ),
  );

describe("parseCsv", () => {
  it("splits rows and cells", () => {
    const text = "name,count\nalpha,1\nbeta,22\n";
    const grid = parseCsv(text, ",", false);
    expect(grid.rows).toBe(3);
    expect(grid.columns).toBe(2);
    expect(rows(text, grid)).toEqual([
      ["name", "count"],
      ["alpha", "1"],
      ["beta", "22"],
    ]);
  });

  it("handles quotes, escaped quotes, embedded delimiters and newlines", () => {
    const text = 'a,b\r\n"x, y","say ""hi""\nthere"\r\n';
    const grid = parseCsv(text, ",", false);
    expect(rows(text, grid)).toEqual([
      ["a", "b"],
      ["x, y", 'say "hi"\nthere'],
    ]);
  });

  it("skips a byte order mark and supports tabs", () => {
    const text = "\ufeffa\tb\n1\t2";
    const grid = parseCsv(text, "\t", false);
    expect(rows(text, grid)).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  it("drops the last partial row when the text is truncated", () => {
    const text = "a,b\n1,2\n3,";
    expect(parseCsv(text, ",", true).rows).toBe(2);
    expect(parseCsv(text, ",", false).rows).toBe(3);
  });

  it("keeps a trailing empty cell", () => {
    const text = "a,b\n1,";
    const grid = parseCsv(text, ",", false);
    expect(rows(text, grid)).toEqual([
      ["a", "b"],
      ["1", ""],
    ]);
  });

  it("counts ragged rows and the widest row", () => {
    const grid = parseCsv("a,b\n1\n1,2,3\n4,5", ",", false);
    expect(grid.columns).toBe(3);
    expect(grid.ragged).toBe(2);
  });

  it("detects numeric columns and estimates widths in characters", () => {
    const text = "label,amount\nfirst,1,200\nsecond,3.5%\n";
    const grid = parseCsv(
      'label,amount\nfirst,"1,200"\nsecond,3.5%\n',
      ",",
      false,
    );
    expect(grid.numeric).toEqual([false, true]);
    expect(grid.widths[0]).toBe(8);
    expect(
      parseCsv(text, ",", false).widths.every(
        (width) => width >= 4 && width <= 40,
      ),
    ).toBe(true);
  });

  it("returns an empty grid for empty text", () => {
    const grid = parseCsv("", ",", false);
    expect(grid.rows).toBe(0);
    expect(grid.columns).toBe(0);
  });
});

describe("sortOrder", () => {
  it("sorts numbers and keeps blanks last in both directions", () => {
    const text = "n\n10\n\n2\n33";
    const grid = parseCsv(text, ",", false);
    const cache = new Map();
    expect([...sortOrder(text, grid, cache, 0, "ascending")]).toEqual([
      2, 0, 3, 1,
    ]);
    expect([...sortOrder(text, grid, cache, 0, "descending")]).toEqual([
      3, 0, 2, 1,
    ]);
    expect(cache.has(0)).toBe(true);
  });

  it("sorts ascii text naturally and case-insensitively", () => {
    const text = "file\nitem10\nItem2\nitem1";
    const grid = parseCsv(text, ",", false);
    expect([...sortOrder(text, grid, new Map(), 0, "ascending")]).toEqual([
      2, 1, 0,
    ]);
  });

  it("falls back to the collator for non-ascii text", () => {
    const text = "word\nzèbre\nàpple\nmango";
    const grid = parseCsv(text, ",", false);
    const keys = sortKeys(text, grid, 0);
    expect(keys instanceof Float64Array ? undefined : keys.folded).toBe(false);
    expect([...sortOrder(text, grid, new Map(), 0, "ascending")]).toEqual([
      1, 2, 0,
    ]);
  });
});
