import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  SortableTableHeaderCell,
  Table,
  TableCell,
  TableGroup,
  TableRow,
  tableColumns,
} from "./table";

describe("tableColumns", () => {
  it("gives fluid tracks the lead and fluid minimums", () => {
    expect(tableColumns("minmax(0,3fr) minmax(0,2fr) auto")).toBe(
      "minmax(var(--table-lead-min),3fr) minmax(var(--table-fluid-min),2fr) auto",
    );
  });

  it("lets fixed minimums collapse on narrow screens", () => {
    expect(tableColumns("minmax(6rem,auto)")).toBe(
      "minmax(var(--table-auto-min,6rem),auto)",
    );
  });

  it("expands repeat()", () => {
    expect(tableColumns("repeat(2, minmax(0,1fr))")).toBe(
      "minmax(var(--table-lead-min),1fr) minmax(var(--table-fluid-min),1fr)",
    );
  });
});

describe("Table", () => {
  it("renders an ARIA grid with group counts and sort state", () => {
    render(
      <Table columns="minmax(0,1fr) auto">
        <TableRow>
          <SortableTableHeaderCell direction="ascending" onSort={() => {}}>
            Name
          </SortableTableHeaderCell>
        </TableRow>
        <TableGroup label="Active" count={2} />
        <TableRow>
          <TableCell>Cell</TableCell>
        </TableRow>
      </Table>,
    );
    expect(screen.getByRole("table").getAttribute("data-slot")).toBe("table");
    expect(screen.getByRole("columnheader").getAttribute("aria-sort")).toBe(
      "ascending",
    );
    expect(screen.getByText("2")).toBeTruthy();
    expect(screen.getByRole("cell").textContent).toBe("Cell");
  });
});
