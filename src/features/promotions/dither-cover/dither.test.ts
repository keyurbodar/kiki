import { describe, expect, it } from "vitest";
import { bayerThreshold, coverFrame, GRID, maskAlpha } from "./dither";

describe("bayerThreshold", () => {
  it("covers (0, 1) and tiles every 8 cells", () => {
    const values = new Set<number>();
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) values.add(bayerThreshold(x, y));
    }
    expect(values.size).toBe(64);
    expect(Math.min(...values)).toBeGreaterThan(0);
    expect(Math.max(...values)).toBeLessThan(1);
    expect(bayerThreshold(9, 10)).toBe(bayerThreshold(1, 2));
  });
});

describe("coverFrame", () => {
  it("holds, reveals, then fades", () => {
    expect(coverFrame(0)).toEqual({ reveal: 0, opacity: 1 });
    expect(coverFrame(1400)).toEqual({ reveal: 1, opacity: 1 });
    expect(coverFrame(3400).opacity).toBeCloseTo(0.5);
    expect(coverFrame(3800)).toEqual({ reveal: 1, opacity: 0 });
  });
});

describe("maskAlpha", () => {
  const full = new Float32Array(GRID * GRID).fill(1);
  const center = (GRID / 2) * GRID + GRID / 2;

  it("hides everything before the reveal", () => {
    expect(maskAlpha(full, 0).every((value) => value === 0)).toBe(true);
  });

  it("reveals from the centre outward", () => {
    const partial = maskAlpha(full, 0.4);
    expect(partial[center]).toBe(255);
    expect(partial[0]).toBe(0);
    const revealed = maskAlpha(full, 1);
    const row = revealed.slice(center - GRID / 2, center + GRID / 2);
    expect(row.every((value) => value === 255)).toBe(true);
  });

  it("only paints where the mark covers", () => {
    expect(maskAlpha(new Float32Array(GRID * GRID), 1)[center]).toBe(0);
  });
});
