import { describe, expect, it, vi } from "vitest";
import { imageObjectUrl, wallpaperKey, wallpaperSource } from "./wallpaper";

describe("wallpaper", () => {
  it("labels the blob with the type it sniffs from the bytes", () => {
    const create = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:kiki/wallpaper");
    expect(imageObjectUrl(new Uint8Array([137, 80, 78, 71]))).toBe(
      "blob:kiki/wallpaper",
    );
    const blob = create.mock.calls[0]?.[0] as Blob;
    expect(blob.type).toBe("image/png");
    create.mockRestore();
  });

  it("reuses one url for one response", () => {
    const create = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:kiki/wallpaper");
    const bytes = new Uint8Array([255, 216, 255]);
    imageObjectUrl(bytes);
    imageObjectUrl(bytes);
    expect(create).toHaveBeenCalledTimes(1);
    create.mockRestore();
  });

  it("accepts bytes or a url and ignores anything else", () => {
    const create = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:kiki/wallpaper");
    expect(wallpaperSource(new Uint8Array([82, 73, 70, 70]))).toBe(
      "blob:kiki/wallpaper",
    );
    expect(wallpaperSource("/wallpapers/a.webp")).toBe("/wallpapers/a.webp");
    expect(wallpaperSource({ _tag: "MockNotImplemented" })).toBeUndefined();
    expect(wallpaperSource("")).toBeUndefined();
    create.mockRestore();
  });

  it("keys a wallpaper by slug and version", () => {
    expect(wallpaperKey("harbor", null)).toBe("harbor@");
    expect(wallpaperKey("harbor", "ver_2")).toBe("harbor@ver_2");
  });
});
