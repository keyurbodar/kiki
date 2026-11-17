import { describe, expect, it } from "vitest";
import { imageDataUrl, wallpaperKey, wallpaperSource } from "./wallpaper";

describe("wallpaper", () => {
  it("sniffs the image type from the bytes", () => {
    expect(imageDataUrl(new Uint8Array([137, 80, 78, 71]))).toBe(
      "data:image/png;base64,iVBORw==",
    );
    expect(imageDataUrl(new Uint8Array([255, 216, 255]))).toMatch(
      /^data:image\/jpeg;/,
    );
    expect(imageDataUrl(new Uint8Array([60, 115]))).toMatch(
      /^data:image\/svg\+xml;/,
    );
  });

  it("accepts bytes or a url and ignores anything else", () => {
    expect(wallpaperSource("/wallpapers/a.webp")).toBe("/wallpapers/a.webp");
    expect(wallpaperSource({ _tag: "MockNotImplemented" })).toBeUndefined();
    expect(wallpaperSource("")).toBeUndefined();
  });

  it("keys a wallpaper by slug and version", () => {
    expect(wallpaperKey("harbor", null)).toBe("harbor@");
    expect(wallpaperKey("harbor", "ver_2")).toBe("harbor@ver_2");
  });
});
