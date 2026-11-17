import { describe, expect, it } from "vitest";
import { clampZoom, keyZoom, wheelFactor, zoomAround } from "./pan-zoom-math";

describe("pan zoom math", () => {
  it("clamps between a quarter and four by default", () => {
    expect(clampZoom(10)).toBe(4);
    expect(clampZoom(0.1)).toBe(0.25);
    expect(clampZoom(1.5)).toBe(1.5);
  });

  it("caps one wheel tick and zooms in on scroll up", () => {
    const up = wheelFactor({
      deltaY: -100,
      deltaMode: 0,
      ctrlKey: false,
      pageHeight: 800,
    });
    expect(up).toBeCloseTo(Math.exp(0.2));
    const pinch = wheelFactor({
      deltaY: 5,
      deltaMode: 0,
      ctrlKey: true,
      pageHeight: 800,
    });
    expect(pinch).toBeCloseTo(Math.exp(-0.05));
  });

  it("keeps the point under the cursor fixed", () => {
    const next = zoomAround(
      { zoom: 1, pan: { x: 0, y: 0 } },
      2,
      { x: 10, y: -20 },
      4,
      0.25,
    );
    expect(next.zoom).toBe(2);
    expect(next.pan).toEqual({ x: -10, y: 20 });
  });

  it("recentres at the minimum zoom", () => {
    const next = zoomAround(
      { zoom: 0.3, pan: { x: 5, y: 5 } },
      0.5,
      { x: 1, y: 1 },
      4,
      0.25,
    );
    expect(next).toEqual({ zoom: 0.25, pan: { x: 0, y: 0 } });
  });

  it("maps keys to zoom steps and presets", () => {
    const state = { zoom: 1, pan: { x: 4, y: 8 } };
    expect(keyZoom(state, "+", 4, 0.25)?.zoom).toBe(1.25);
    expect(keyZoom(state, "-", 4, 0.25)?.zoom).toBe(0.8);
    expect(keyZoom(state, "0", 4, 0.25)).toEqual({
      zoom: 1,
      pan: { x: 0, y: 0 },
    });
    expect(keyZoom(state, "2", 4, 0.25, 0.5)?.zoom).toBe(1);
    expect(keyZoom(state, "x", 4, 0.25)).toBeUndefined();
  });
});
