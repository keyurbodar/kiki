import { describe, expect, it } from "vitest";
import { fileCountLabel, formatBytes } from "./format-bytes";

describe("formatBytes", () => {
  it("formats bytes the way Capy does", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(1023)).toBe("1023 B");
    expect(formatBytes(1536)).toBe("1.5 KB");
    expect(formatBytes(20 * 1024)).toBe("20 KB");
    expect(formatBytes(5 * 1024 ** 3)).toBe("5.0 GB");
    expect(formatBytes(-1)).toBe("—");
    expect(formatBytes(Number.NaN)).toBe("—");
  });

  it("pluralizes file counts", () => {
    expect(fileCountLabel(1)).toBe("1 file");
    expect(fileCountLabel(2)).toBe("2 files");
  });
});
