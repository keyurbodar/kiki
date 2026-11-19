import { describe, expect, it } from "vitest";
import { placeSelectionToolbar } from "@/components/composer";

const viewport = { width: 1440, height: 900 };
const line = (top: number) => ({
  text: "quote",
  rect: { top, height: 20 },
  focus: { x: 700 },
});

describe("selection card placement", () => {
  it("sits above a line with room over it", () => {
    const place = placeSelectionToolbar(line(400), viewport, {
      width: 68,
      side: "above",
      align: "center",
    });
    expect(place.top).toBeLessThan(400);
    expect(place.top).toBeGreaterThanOrEqual(8);
  });

  it("flips below a line against the top edge", () => {
    const place = placeSelectionToolbar(line(20), viewport, {
      width: 68,
      side: "above",
      align: "center",
    });
    expect(place.top).toBeGreaterThan(40);
  });

  it("flips above a line against the bottom edge", () => {
    const place = placeSelectionToolbar(line(880), viewport, {
      width: 68,
      side: "below",
      align: "center",
    });
    expect(place.top).toBeLessThan(880);
  });

  it("keeps the card inside the viewport's horizontal edges", () => {
    const left = placeSelectionToolbar(
      { ...line(400), focus: { x: 2 } },
      viewport,
      { width: 68, side: "above", align: "center" },
    );
    const right = placeSelectionToolbar(
      { ...line(400), focus: { x: 1439 } },
      viewport,
      { width: 68, side: "above", align: "center" },
    );
    expect("left" in left && left.left).toBe(8);
    expect("left" in right && right.left).toBe(1440 - 68 - 8);
  });
});
