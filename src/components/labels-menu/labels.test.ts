import { describe, expect, it } from "vitest";
import {
  labelMatches,
  labelMenuItems,
  labelToggle,
  readLabels,
  sortLabels,
} from "./labels";

describe("label menus", () => {
  it("merges options and applied labels, sorted by name", () => {
    const options = [
      { name: "beta", color: "ff0000" },
      { name: "alpha", color: null },
    ];
    const applied = [{ name: "extra", color: null }];
    expect(labelMenuItems(options, applied).map((label) => label.name)).toEqual(
      ["alpha", "beta", "extra"],
    );
    expect(sortLabels(options).map((label) => label.name)).toEqual([
      "alpha",
      "beta",
    ]);
  });

  it("filters by name and description", () => {
    const label = {
      name: "needs-review",
      color: null,
      description: "Review requested",
    };
    expect(labelMatches(label, "REVIEW")).toBe(true);
    expect(labelMatches(label, "missing")).toBe(false);
  });

  it("finds the one label a multi-select toggled", () => {
    const selected = [{ name: "a", color: null }];
    expect(
      labelToggle([...selected, { name: "b", color: null }], selected),
    ).toEqual({ name: "b", applied: true });
    expect(labelToggle([], selected)).toEqual({ name: "a", applied: false });
    expect(labelToggle(selected, selected)).toBeNull();
  });

  it("reads list and wrapped responses", () => {
    expect(readLabels({ labels: [{ name: "a", color: "#abcdef" }] })).toEqual([
      { name: "a", color: "abcdef", description: null, id: undefined },
    ]);
  });
});
