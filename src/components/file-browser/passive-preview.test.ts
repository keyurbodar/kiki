import { describe, expect, it } from "vitest";
import {
  fileKind,
  isMarkdownPath,
  markdownExcerpt,
  passivePreview,
  previewSnippet,
} from "./passive-preview";

describe("fileKind", () => {
  it("reads the media type first, then the extension", () => {
    expect(fileKind({ name: "a.bin", mediaType: "image/png" })).toBe("image");
    expect(fileKind({ name: "clip.MOV", mediaType: "" })).toBe("video");
    expect(fileKind({ name: "sheet.xlsx", mediaType: "" })).toBe("sheet");
    expect(fileKind({ name: "part.stl", mediaType: "" })).toBe("model");
    expect(fileKind({ name: "notes.txt", mediaType: "" })).toBeUndefined();
  });

  it("never treats svg as an image", () => {
    expect(
      fileKind({ name: "logo.svg", mediaType: "image/svg+xml" }),
    ).toBeUndefined();
  });
});

describe("passivePreview", () => {
  it("leaves small text and images to the live preview", () => {
    expect(passivePreview({ path: "a/b.ts", sizeBytes: 100 })).toBeUndefined();
    expect(passivePreview({ path: "a/b.png", sizeBytes: 100 })).toBeUndefined();
  });

  it("labels files it can't preview inline", () => {
    expect(passivePreview({ path: "big.png", sizeBytes: 3_000_000 })).toEqual({
      kind: "placeholder",
      label: "Image",
      sub: "Open to view",
    });
    expect(passivePreview({ path: "doc.pdf", sizeBytes: 1 })).toEqual({
      kind: "placeholder",
      label: "PDF document",
      sub: "Open to view pages",
    });
    expect(passivePreview({ path: "song.mp3", sizeBytes: 1 })).toEqual({
      kind: "placeholder",
      label: "Audio",
      sub: "Open to play",
    });
    expect(passivePreview({ path: "a.zip", sizeBytes: 1 })).toEqual({
      kind: "placeholder",
      label: "ZIP file",
      sub: "No preview for this file type",
    });
    expect(passivePreview({ path: "long.md", sizeBytes: 70_000 })).toEqual({
      kind: "placeholder",
      label: "Markdown",
      sub: "Open to read",
    });
  });
});

describe("text excerpts", () => {
  it("keeps the first lines and clips long ones", () => {
    const text = Array.from({ length: 30 }, (_, i) => `line ${i}`).join("\n");
    expect(previewSnippet(text).split("\n")).toHaveLength(20);
    expect(previewSnippet("x".repeat(300))).toHaveLength(200);
  });

  it("drops front matter and cuts at a paragraph", () => {
    expect(markdownExcerpt("---\ntitle: x\n---\n# Hi")).toBe("# Hi");
    expect(markdownExcerpt("one\n\ntwo three", 8)).toBe("one");
  });

  it("detects markdown paths", () => {
    expect(isMarkdownPath("a/B.MDX")).toBe(true);
    expect(isMarkdownPath("a/b.txt")).toBe(false);
  });
});
