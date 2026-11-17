import { describe, expect, it } from "vitest";
import { sectionCopyText, splitSections } from "./sections";

describe("splitSections", () => {
  it("splits blocks into sections", () => {
    expect(splitSections("One.\n\nTwo.\n\n- a\n- b")).toEqual([
      "One.",
      "Two.",
      "- a\n- b",
    ]);
  });

  it("folds headings and bold-only lines into the next block", () => {
    expect(splitSections("## Plan\n\n**Steps**\n\nDo it.")).toEqual([
      "## Plan\n\n**Steps**\n\nDo it.",
    ]);
  });

  it("keeps a trailing heading as its own section", () => {
    expect(splitSections("Body.\n\n## Tail")).toEqual(["Body.", "## Tail"]);
  });

  it("drops rules and joins consecutive image paragraphs", () => {
    expect(
      splitSections("Look:\n\n![a](a.png)\n\n![b](b.png)\n\n---\n\nDone."),
    ).toEqual(["Look:", "![a](a.png)\n\n![b](b.png)", "Done."]);
  });

  it("appends link definitions to the sections that use them", () => {
    expect(
      splitSections("See [docs][d].\n\nOther.\n\n[d]: https://example.com"),
    ).toEqual(["See [docs][d].\n\n[d]: https://example.com", "Other."]);
  });

  it("returns whitespace-free empty input as no sections", () => {
    expect(splitSections("   ")).toEqual([]);
  });
});

describe("sectionCopyText", () => {
  it("copies a lone code block's code", () => {
    expect(sectionCopyText("```ts\nconst a = 1;\n```")).toBe("const a = 1;");
  });

  it("copies the inside of a lone quote", () => {
    expect(sectionCopyText("> quoted\n> text")).toBe("quoted\ntext");
  });

  it("copies other sections as markdown", () => {
    expect(sectionCopyText("**Bold** text")).toBe("**Bold** text");
  });
});
