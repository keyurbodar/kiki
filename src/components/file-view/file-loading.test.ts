import { describe, expect, it } from "vitest";
import { downloadFraction, downloadLabel } from "./file-loading";

describe("download progress", () => {
  it("reports a fraction only when the total is known", () => {
    expect(downloadFraction({ loaded: 50, total: 200 })).toBe(0.25);
    expect(downloadFraction({ loaded: 300, total: 200 })).toBe(1);
    expect(downloadFraction({ loaded: 50 })).toBeUndefined();
    expect(downloadFraction({ loaded: 50, total: 0 })).toBeUndefined();
  });

  it("labels the bytes loaded", () => {
    expect(downloadLabel({ loaded: 512 })).toBe("Loading 512 B");
    expect(downloadLabel({ loaded: 1024, total: 2048 })).toBe(
      "Loading 1.0 KB of 2.0 KB",
    );
  });
});
