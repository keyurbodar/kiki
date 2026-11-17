import { describe, expect, it } from "vitest";
import { zoomIn, zoomOut, zoomPercent } from "./zoom";

describe("file toolbar zoom", () => {
  it("steps by a quarter and clamps to the bounds", () => {
    expect(zoomIn(1, 4)).toBe(1.25);
    expect(zoomOut(1.25, 0.25)).toBe(1);
    expect(zoomIn(3.5, 4)).toBe(4);
    expect(zoomOut(0.3, 0.25)).toBe(0.25);
  });

  it("rounds the label to a whole percent", () => {
    expect(zoomPercent(1)).toBe(100);
    expect(zoomPercent(1.5625)).toBe(156);
    expect(zoomPercent(0.8)).toBe(80);
  });
});
