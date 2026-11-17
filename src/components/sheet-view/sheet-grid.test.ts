import { describe, expect, it } from "vitest";
import { read, utils, write } from "xlsx";
import { cellText } from "@/components/csv-table";
import { sheetNotices, sheetToGrid, spanMap } from "./sheet-grid";

const workbook = () => {
  const sheet = utils.aoa_to_sheet([
    ["Region", "Units", "Total"],
    ["North", 12, 30],
    ["South", 7, 18],
  ]);
  sheet["!merges"] = [{ s: { r: 0, c: 1 }, e: { r: 0, c: 2 } }];
  sheet.D2 = { t: "z", f: "B2*2" };
  sheet["!ref"] = "A1:D3";
  const book = utils.book_new();
  utils.book_append_sheet(book, sheet, "Summary");
  const bytes = write(book, { type: "array", bookType: "xlsx" });
  return read(bytes, { type: "array", dense: true, sheetStubs: true });
};

describe("sheetToGrid", () => {
  const book = workbook();
  const sheet = book.Sheets.Summary;
  if (sheet === undefined) throw new Error("missing sheet");
  const result = sheetToGrid(utils, "Summary", sheet);

  it("adds a letter header row and keeps cell text", () => {
    expect(result.grid.rows).toBe(4);
    expect(result.grid.columns).toBe(4);
    expect(cellText(result.text, result.grid, 0, 0)).toBe("A");
    expect(cellText(result.text, result.grid, 0, 3)).toBe("D");
    expect(cellText(result.text, result.grid, 1, 0)).toBe("Region");
    expect(cellText(result.text, result.grid, 2, 1)).toBe("12");
  });

  it("marks numeric columns and formulas without results", () => {
    expect(result.grid.numeric.slice(0, 3)).toEqual([false, true, true]);
    expect(cellText(result.text, result.grid, 2, 3)).toBe("=B2*2");
    expect([...result.pending]).toEqual([1 * 4 + 3]);
    expect(result.limited).toBe(false);
  });

  it("records merged cells as spans", () => {
    expect([...result.spans]).toEqual([0, 1, 2]);
    expect(spanMap(result.spans).get(0)?.get(1)).toBe(2);
  });

  it("describes the notices for the sheet", () => {
    expect(sheetNotices(result)).toEqual([
      "1 formula was saved without a result, so it shows as written until the file is recalculated",
    ]);
    expect(
      sheetNotices({
        ...result,
        pending: new Uint32Array([1, 2]),
        limited: true,
      }),
    ).toEqual([
      "Showing the first 3 rows of this sheet",
      "2 formulas were saved without a result, so they show as written until the file is recalculated",
    ]);
  });
});
