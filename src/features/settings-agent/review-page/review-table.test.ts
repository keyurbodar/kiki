import { describe, expect, it } from "vitest";
import { spacing, tableColumns } from "./review-table";

describe("tableColumns", () => {
  it("gives fluid tracks a lead or fluid minimum", () => {
    expect(tableColumns(["minmax(0,2.4fr)", "minmax(0,1fr)", "auto"])).toBe(
      "minmax(var(--table-lead-min),2.4fr) minmax(var(--table-fluid-min),1fr) auto",
    );
  });

  it("makes fixed minimums of auto tracks overridable", () => {
    expect(
      tableColumns([`minmax(${spacing(24)},auto)`, "minmax(0,auto)"]),
    ).toBe(
      "minmax(var(--table-auto-min,calc(var(--spacing)*24)),auto) minmax(var(--table-fluid-min),auto)",
    );
  });

  it("leaves other tracks alone", () => {
    expect(tableColumns([`minmax(${spacing(40)},3fr)`])).toBe(
      "minmax(calc(var(--spacing)*40),3fr)",
    );
  });
});
