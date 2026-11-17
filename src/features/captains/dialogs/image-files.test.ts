import { describe, expect, it } from "vitest";
import { isPictureFile, sharedImageProblem } from "./image-files";

describe("captain image files", () => {
  it("accepts GIF, JPEG, PNG and WebP pictures up to 10 MB", () => {
    expect(isPictureFile({ size: 1, type: "image/gif" })).toBe(true);
    expect(isPictureFile({ size: 10 * 1024 * 1024, type: "image/webp" })).toBe(
      true,
    );
    expect(
      isPictureFile({ size: 10 * 1024 * 1024 + 1, type: "image/png" }),
    ).toBe(false);
    expect(isPictureFile({ size: 0, type: "image/png" })).toBe(false);
    expect(isPictureFile({ size: 1, type: "image/svg+xml" })).toBe(false);
  });

  it("refuses shared images over 5 MB or without alpha formats", () => {
    expect(
      sharedImageProblem({ size: 6 * 1024 * 1024, type: "image/png" }),
    ).toBe("Shared images go up to 5 MB");
    expect(sharedImageProblem({ size: 1, type: "image/jpeg" })).toBe(
      "Shared images need a transparent background",
    );
    expect(sharedImageProblem({ size: 1, type: "image/webp" })).toBeUndefined();
  });
});
