import { describe, expect, it } from "vitest";
import {
  crumbDirs,
  fileMeta,
  fileName,
  formatBytes,
  hasRenderedView,
  mediaKind,
  middleEllipsis,
  shouldGate,
} from "./file-kind";

describe("file kind", () => {
  it("prefers the media type and falls back to the extension", () => {
    expect(mediaKind({ name: "a.bin", mediaType: "image/png" })).toBe("image");
    expect(mediaKind({ name: "clip.MOV", mediaType: "" })).toBe("video");
    expect(mediaKind({ name: "deck.docx", mediaType: "" })).toBe("document");
    expect(mediaKind({ name: "logo.svg", mediaType: "image/svg+xml" })).toBe(
      undefined,
    );
    expect(mediaKind({ name: "notes.txt", mediaType: "" })).toBe(undefined);
  });

  it("only offers a rendered view for markdown and svg", () => {
    expect(hasRenderedView("README.md")).toBe(true);
    expect(hasRenderedView("icon.svg")).toBe(true);
    expect(hasRenderedView("data.csv")).toBe(false);
    expect(hasRenderedView("main.ts")).toBe(false);
  });

  it("gates large text and very large sheets", () => {
    expect(shouldGate("a.ts", 2e6, undefined)).toBe(true);
    expect(shouldGate("a.csv", 2e6, undefined)).toBe(false);
    expect(shouldGate("a.png", 2e9, "image")).toBe(false);
    expect(shouldGate("a.xlsx", 65e6, "sheet")).toBe(true);
  });

  it("formats sizes like Capy", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(1536)).toBe("1.5 KB");
    expect(formatBytes(20 * 1024 * 1024)).toBe("20 MB");
    expect(formatBytes(-1)).toBe("—");
    expect(fileMeta("main.ts", 2048)).toBe("ts · 2.0 KB");
    expect(fileMeta("Makefile", 10)).toBe("file · 10 B");
  });

  it("splits names and crumbs", () => {
    expect(fileName("src/app/main.ts")).toBe("main.ts");
    expect(fileName("C:\\work\\a.txt")).toBe("a.txt");
    expect(crumbDirs("src/app/main.ts", "main.ts")).toEqual(["src", "app"]);
    expect(crumbDirs("main.ts", "main.ts")).toEqual([]);
  });

  it("cuts long names in the middle and keeps the extension", () => {
    const name = "a-very-long-component-name.tsx";
    const cut = middleEllipsis(name, (text) => text.length <= 16);
    expect(cut.length).toBeLessThanOrEqual(16);
    expect(cut.endsWith("name.tsx")).toBe(true);
    expect(cut).toContain("…");
  });
});
