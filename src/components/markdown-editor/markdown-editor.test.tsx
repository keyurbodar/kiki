import { act, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { filterInsertOptions, INSERT_OPTIONS } from "./blocks";
import { codeLanguageLabel } from "./code-language";
import {
  CODE_LANGUAGES,
  filterCodeLanguages,
  findCodeLanguage,
} from "./code-languages";
import { clearEditState, readEditState, registerEditState } from "./edit-state";
import {
  linkTarget,
  MarkdownEditor,
  type MarkdownEditorHandle,
} from "./markdown-editor";
import { isCollapsible } from "./preview-blocks";
import { previewSource } from "./preview-blocks/source-block-preview";
import { placeToolbar } from "./selection-toolbar";

describe("insert options", () => {
  it("lists every block type plus divider and table", () => {
    expect(
      filterInsertOptions(INSERT_OPTIONS, null).map((option) => option.label),
    ).toEqual([
      "Text",
      "Heading 1",
      "Heading 2",
      "Heading 3",
      "Bulleted list",
      "Numbered list",
      "To-do list",
      "Quote",
      "Code block",
      "Divider",
      "Table",
    ]);
  });

  it("matches labels anywhere and keywords by prefix", () => {
    const labels = (query: string) =>
      filterInsertOptions(INSERT_OPTIONS, query).map((option) => option.label);
    expect(labels("head")).toEqual(["Heading 1", "Heading 2", "Heading 3"]);
    expect(labels("task")).toEqual(["To-do list"]);
    expect(labels("hr")).toEqual(["Divider"]);
    expect(labels("zzz")).toEqual([]);
  });
});

describe("code languages", () => {
  it("resolves ids and aliases", () => {
    expect(findCodeLanguage("TypeScript")?.id).toBe("ts");
    expect(findCodeLanguage("yml")?.name).toBe("YAML");
    expect(findCodeLanguage("nope")).toBeUndefined();
  });

  it("puts plain text first when the query is empty", () => {
    const options = filterCodeLanguages("");
    expect(options[0]).toBeNull();
    expect(options).toHaveLength(CODE_LANGUAGES.length + 1);
  });

  it("filters by name, id prefix and alias prefix, keeping plain text last", () => {
    expect(filterCodeLanguages("pyt").map((option) => option?.id)).toEqual([
      "python",
    ]);
    expect(filterCodeLanguages("plain")).toEqual([null]);
    expect(filterCodeLanguages("qqq")).toEqual([]);
  });

  it("labels the badge", () => {
    expect(codeLanguageLabel("")).toBe("Plain text");
    expect(codeLanguageLabel("rs")).toBe("Rust");
    expect(codeLanguageLabel("custom")).toBe("custom");
  });
});

describe("helpers", () => {
  it("classifies link targets", () => {
    expect(linkTarget("https://example.com").kind).toBe("web");
    expect(linkTarget("docs/readme.md").kind).toBe("file");
    expect(linkTarget("mailto:someone@example.com").kind).toBe("other");
    expect(linkTarget("#section").kind).toBe("other");
  });

  it("keeps the toolbar inside the container and flips it below near the top", () => {
    const container = new DOMRect(0, 100, 400, 600);
    const near = placeToolbar(new DOMRect(10, 120, 20, 16), container, 100);
    expect(near.left).toBe(140);
    expect(near.below).toBe(true);
    const far = placeToolbar(new DOMRect(380, 400, 10, 16), container, 100);
    expect(far.left).toBe(260);
    expect(far.below).toBe(false);
    expect(far.top).toBe(300);
  });

  it("appends definitions to footnote and reference previews only", () => {
    expect(previewSource("footnote", "See [^1]", "[^1]: Note")).toBe(
      "See [^1]\n\n[^1]: Note",
    );
    expect(previewSource("math", "$$x$$", "[^1]: Note")).toBe("$$x$$");
  });

  it("collapses only long frontmatter", () => {
    expect(isCollapsible({ kind: "frontmatter", text: "a\nb\nc\nd" })).toBe(
      true,
    );
    expect(isCollapsible({ kind: "frontmatter", text: "a\nb" })).toBe(false);
    expect(isCollapsible({ kind: "math", text: "a\nb\nc\nd" })).toBe(false);
  });

  it("keeps the last text of an edit state after its editor unmounts", () => {
    let text = "draft";
    const release = registerEditState("doc", () => text);
    expect(readEditState("doc")).toBe("draft");
    text = "final";
    release();
    text = "changed later";
    expect(readEditState("doc")).toBe("final");
    clearEditState("doc");
    expect(readEditState("doc")).toBeUndefined();
  });
});

describe("MarkdownEditor", () => {
  it("renders the document and returns its markdown unchanged", async () => {
    const ref = createRef<MarkdownEditorHandle>();
    const text =
      "# Sample\n\n- [ ] first task\n- [x] second task\n\n| a | b |\n|---|---|\n| 1 | 2 |\n";
    await act(async () => {
      render(<MarkdownEditor initialText={text} ref={ref} />);
    });
    const document = screen.getByRole("textbox", { name: "Document" });
    expect(document.getAttribute("data-markdown-editor")).toBe("");
    expect(document.querySelector("h1")?.textContent).toBe("Sample");
    expect(document.querySelectorAll("[data-check-box] input")).toHaveLength(2);
    expect(document.querySelector("table.md-editor-table")).not.toBeNull();
    expect(ref.current?.getText()).toBe(text);
  });

  it("renders source blocks with their chrome", async () => {
    await act(async () => {
      render(<MarkdownEditor initialText={"---\ntitle: Sample\n---\n"} />);
    });
    const block = document.querySelector("[data-source-block]");
    expect(block?.getAttribute("data-kind")).toBe("frontmatter");
    expect(
      block?.querySelector('[data-slot="markdown-code-language"]')?.textContent,
    ).toBe("Properties");
  });
});
