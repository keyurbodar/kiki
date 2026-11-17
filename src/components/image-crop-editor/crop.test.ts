import { describe, expect, it } from "vitest";
import {
  type CropRect,
  clampCrop,
  dragCrop,
  FULL_CROP,
  fitAspect,
  isFullCrop,
  lockAspect,
  MIN_CROP,
  rotate,
  rotateCrop,
  rotatedSize,
  squareCrop,
  zoomCrop,
} from "./crop";

const rect = (
  x: number,
  y: number,
  width: number,
  height: number,
): CropRect => ({
  x,
  y,
  width,
  height,
});

const close = (actual: CropRect, expected: CropRect) => {
  for (const key of ["x", "y", "width", "height"] as const)
    expect(actual[key]).toBeCloseTo(expected[key], 10);
};

describe("crop basics", () => {
  it("clamps position and size to the unit square", () => {
    expect(clampCrop(rect(-1, -1, 2, 2))).toEqual(FULL_CROP);
    expect(clampCrop(rect(0.9, 0.9, 0.5, 0.5))).toEqual(
      rect(0.5, 0.5, 0.5, 0.5),
    );
    expect(clampCrop(rect(0.5, 0.5, 0, 0))).toEqual(
      rect(0.5, 0.5, MIN_CROP, MIN_CROP),
    );
    expect(isFullCrop(FULL_CROP)).toBe(true);
    expect(isFullCrop(rect(0, 0, 0.9, 1))).toBe(false);
  });

  it("centres the largest square crop", () => {
    expect(squareCrop({ width: 200, height: 100 })).toEqual(
      rect(0.25, 0, 0.5, 1),
    );
    expect(squareCrop({ width: 100, height: 200 })).toEqual(
      rect(0, 0.25, 1, 0.5),
    );
    expect(squareCrop({ width: 100, height: 100 })).toEqual(FULL_CROP);
  });

  it("rotates angles and swaps dimensions on quarter turns", () => {
    expect(rotate(0, 1)).toBe(90);
    expect(rotate(90, 3)).toBe(0);
    expect(rotate(270, 1)).toBe(0);
    expect(rotatedSize({ width: 200, height: 100 }, 90)).toEqual({
      width: 100,
      height: 200,
    });
    expect(rotatedSize({ width: 200, height: 100 }, 180)).toEqual({
      width: 200,
      height: 100,
    });
  });
});

describe("rotateCrop", () => {
  it("moves the crop clockwise and counter-clockwise", () => {
    const start = rect(0.1, 0.2, 0.3, 0.4);
    expect(rotateCrop(start, 1)).toEqual(rect(0.4, 0.1, 0.4, 0.3));
    close(rotateCrop(start, 3), rect(0.2, 0.6, 0.4, 0.3));
  });

  it("round-trips after four turns in either direction", () => {
    for (const turns of [1, 3]) {
      let current = rect(0.1, 0.2, 0.3, 0.4);
      for (let i = 0; i < 4; i++) current = rotateCrop(current, turns);
      close(current, rect(0.1, 0.2, 0.3, 0.4));
    }
  });
});

describe("dragCrop", () => {
  it("moves a crop but clamps it to the image", () => {
    const start = rect(0.2, 0.2, 0.4, 0.4);
    close(dragCrop(start, "move", 0.1, -0.1), rect(0.3, 0.1, 0.4, 0.4));
    expect(dragCrop(start, "move", 10, 10)).toEqual(rect(0.6, 0.6, 0.4, 0.4));
    expect(dragCrop(start, "move", -10, -10)).toEqual(rect(0, 0, 0.4, 0.4));
  });

  it("grows from the south-east handle", () => {
    close(
      dragCrop(rect(0.2, 0.2, 0.4, 0.4), "se", 0.2, 0.1),
      rect(0.2, 0.2, 0.6, 0.5),
    );
  });

  it("keeps the minimum crop size when shrinking", () => {
    const start = rect(0.2, 0.2, 0.4, 0.4);
    close(dragCrop(start, "se", -10, -10), rect(0.2, 0.2, MIN_CROP, MIN_CROP));
    close(dragCrop(start, "nw", 10, 10), rect(0.55, 0.55, MIN_CROP, MIN_CROP));
  });
});

describe("ratio helpers", () => {
  it("keeps the requested ratio when resizing a handle", () => {
    const start = rect(0.2, 0.2, 0.4, 0.2);
    close(
      lockAspect(start, rect(0.2, 0.2, 0.6, 0.1), "e", 2),
      rect(0.2, 0.15, 0.6, 0.3),
    );
    close(
      lockAspect(start, rect(0.2, 0.2, 0.4, 0.8), "s", 1),
      rect(0, 0.2, 0.8, 0.8),
    );
    close(
      lockAspect(start, rect(0.2, 0.2, 0.1, 0.2), "n", 1),
      rect(0.3, 0.2, 0.2, 0.2),
    );
  });

  it("keeps the centre while zooming", () => {
    const start = rect(0.25, 0.25, 0.5, 0.5);
    close(zoomCrop(start, 0.5), rect(0.375, 0.375, 0.25, 0.25));
    close(zoomCrop(start, 3), FULL_CROP);
    close(zoomCrop(start, 0), rect(0.475, 0.475, MIN_CROP, MIN_CROP));
  });

  it("fits a ratio inside the current crop without moving its centre", () => {
    const start = rect(0.25, 0.25, 0.5, 0.5);
    close(fitAspect(start, 2), rect(0.25, 0.375, 0.5, 0.25));
    close(fitAspect(start, 0.5), rect(0.375, 0.25, 0.25, 0.5));
    close(fitAspect(start, 1), start);
  });
});
