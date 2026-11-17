import { $createHeadingNode } from "@lexical/rich-text";
import { $createTextNode, $getRoot, createEditor } from "lexical";
import { describe, expect, it } from "vitest";
import {
  $blockMarkdown,
  $exportMarkdown,
  $importMarkdown,
  displayWidth,
} from "./markdown";
import { $isMarkdownSourceNode, MARKDOWN_EDITOR_NODES } from "./nodes";

const makeEditor = () =>
  createEditor({
    namespace: "markdown-editor-test",
    nodes: [...MARKDOWN_EDITOR_NODES],
    onError: (error) => {
      throw error;
    },
  });

const load = (text: string) => {
  const editor = makeEditor();
  editor.update(() => $importMarkdown($getRoot(), text), { discrete: true });
  return editor;
};

const exportText = (editor: ReturnType<typeof makeEditor>) =>
  editor.read(() => $exportMarkdown($getRoot()).text);

describe("markdown round trip", () => {
  const documents = {
    blocks:
      "# Title\n\nSome *soft* and **strong** text with `code`.\n\n> A quote\n\n---\n",
    lists:
      "* one\n* two\n  * nested\n\n1) first\n2) second\n\n- [ ] open\n- [x] done\n",
    table: "| Name | Size |\n|:--|--:|\n| alpha | 1 |\n| beta | 22 |\n",
    code: "~~~ts title=x\nconst a = 1;\n~~~\n\n```\n\n```\n",
    sources:
      "---\ntitle: Sample\n---\n\n$$\nx^2\n$$\n\n<div>raw</div>\n\nSee [^1].\n\n[^1]: A note.\n",
    spacing: "\n\nA\n\n\n\nB   \n\n\n",
    crlf: "# Head\r\n\r\n- a\r\n- b\r\n",
  };

  for (const [name, text] of Object.entries(documents)) {
    it(`keeps an untouched ${name} document byte for byte`, () => {
      expect(exportText(load(text))).toBe(text);
    });
  }

  it("keeps an empty document", () => {
    expect(exportText(load(""))).toBe("");
  });

  it("regenerates only the block that changed", () => {
    const editor = load("# Old\n\n* kept   as is\n");
    editor.update(
      () => {
        const heading = $createHeadingNode("h2");
        heading.append($createTextNode("New"));
        $getRoot().getFirstChildOrThrow().replace(heading);
      },
      { discrete: true },
    );
    expect(exportText(editor)).toBe("## New\n\n* kept   as is\n");
  });

  it("parses frontmatter, math and footnotes as source blocks", () => {
    const editor = load(
      "---\na: 1\n---\n\n$$\n1\n$$\n\nText[^n]\n\n[^n]: Note\n",
    );
    const kinds = editor.read(() =>
      $getRoot()
        .getChildren()
        .map((node) =>
          $isMarkdownSourceNode(node) ? node.getKind() : node.getType(),
        ),
    );
    expect(kinds).toEqual(["frontmatter", "math", "footnote", "definition"]);
  });

  it("keeps mermaid fences as source blocks and other fences as code", () => {
    const editor = load("```mermaid\ngraph TD\n```\n\n```py\nprint(1)\n```\n");
    const types = editor.read(() =>
      $getRoot()
        .getChildren()
        .map((node) => node.getType()),
    );
    expect(types).toEqual(["markdown-source", "code"]);
  });
});

describe("block export", () => {
  const regenerate = (text: string) => {
    const editor = load(text);
    return editor.read(() =>
      $getRoot().getChildren().map($blockMarkdown).join("\n\n"),
    );
  };

  it("pads table columns and writes alignment", () => {
    expect(regenerate("|a|b|c|\n|:-:|-:|:-|\n|long cell|1|x|\n")).toBe(
      [
        "|     a     |   b | c   |",
        "| :-------: | --: | :-- |",
        "| long cell |   1 | x   |",
      ].join("\n"),
    );
  });

  it("writes ordered, nested and task lists", () => {
    expect(regenerate("3. c\n4. d\n")).toBe("3. c\n4. d");
    expect(regenerate("- a\n  - b\n")).toBe("- a\n    - b");
    expect(regenerate("- [x] done\n- [ ] todo\n")).toBe(
      "- [x] done\n- [ ] todo",
    );
  });

  it("nests inline formats and keeps links", () => {
    expect(regenerate('***both*** and [link](https://example.com "T")')).toBe(
      '**_both_** and [link](https://example.com "T")',
    );
  });

  it("grows the code fence past runs in the body", () => {
    expect(regenerate("````md\n```\ninner\n```\n````\n")).toBe(
      "````md\n```\ninner\n```\n````",
    );
  });
});

describe("displayWidth", () => {
  it("counts wide characters twice", () => {
    expect(displayWidth("ab")).toBe(2);
    expect(displayWidth("漢字")).toBe(4);
  });
});
