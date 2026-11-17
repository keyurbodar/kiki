import { describe, expect, it } from "vitest";
import { selectionToolbarPosition } from "./diff-selection-toolbar";

const selection = {
  text: "sample",
  rect: { top: 200, height: 20 },
  focus: { x: 500 },
};

describe("selectionToolbarPosition", () => {
  it("prefers above and flips below when above would clip", () => {
    const viewport = { viewportWidth: 1440, viewportHeight: 900 };
    expect(selectionToolbarPosition({ selection, ...viewport }).top).toBe(156);
    expect(
      selectionToolbarPosition({
        selection: { ...selection, rect: { top: 20, height: 20 } },
        ...viewport,
      }).top,
    ).toBe(46);
  });

  it("keeps the bar inside the viewport on every alignment", () => {
    const viewport = { viewportWidth: 1440, viewportHeight: 900 };
    const farRight = { ...selection, focus: { x: 1430 } };
    expect(
      selectionToolbarPosition({ selection: farRight, ...viewport }).left,
    ).toBeLessThanOrEqual(1440 - 72 - 30 - 8);
    expect(
      selectionToolbarPosition({
        selection: farRight,
        align: "end",
        ...viewport,
      }).right,
    ).toBeGreaterThanOrEqual(8);
  });

  it("honours the explicit bottom limit", () => {
    expect(
      selectionToolbarPosition({
        selection,
        bottom: 180,
        viewportWidth: 1440,
        viewportHeight: 900,
      }).top,
    ).toBeLessThanOrEqual(180 - 8 - 38);
  });
});
