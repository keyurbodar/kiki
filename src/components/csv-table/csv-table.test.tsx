import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { parseCsv } from "./csv-grid";
import { CsvTable, columnLayout, visibleColumns } from "./csv-table";

afterEach(cleanup);

describe("CsvTable", () => {
  it("shows the row and column count", () => {
    render(
      <CsvTable text={"a,b\n1,2\n3,4"} name="sample.csv" truncated={false} />,
    );
    expect(screen.getByRole("grid").getAttribute("aria-rowcount")).toBe("3");
    expect(screen.getByText("2 rows, 2 columns")).toBeTruthy();
  });

  it("marks truncated text as a prefix", () => {
    render(<CsvTable text={"a\n1\n2"} name="sample.csv" truncated />);
    expect(screen.getByText("First 1 row, 1 column")).toBeTruthy();
  });

  it("reports ragged rows", () => {
    render(
      <CsvTable text={"a,b\n1\n2,3"} name="sample.csv" truncated={false} />,
    );
    expect(
      screen.getByText(/1 row has a different column count than the header/),
    ).toBeTruthy();
  });

  it("shows the empty state for an empty file", () => {
    render(<CsvTable text="" name="sample.csv" truncated={false} />);
    expect(screen.getByText("Empty file")).toBeTruthy();
  });
});

describe("column layout", () => {
  const grid = parseCsv("alpha,b,c\n1,2,3", ",", false);

  it("converts character widths to pixels and honours overrides", () => {
    const layout = columnLayout(grid, new Map([[1, 100]]));
    expect(layout.widths).toEqual([8 * 8 + 24, 100, 4 * 8 + 24]);
    expect(layout.offsets).toEqual([0, 88, 188, 244]);
    expect(layout.body).toBe(1);
    expect(layout.gutter).toBe(24);
  });

  it("windows the visible columns with overscan", () => {
    const layout = columnLayout(grid);
    expect(visibleColumns(layout, grid.columns, 0, 100)).toEqual({
      first: 0,
      last: 3,
    });
  });
});
