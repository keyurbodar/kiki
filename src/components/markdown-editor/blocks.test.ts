import { $getRoot, createEditor } from "lexical";
import { describe, expect, it } from "vitest";
import { $setBlockKind } from "./blocks";
import { $importMarkdown } from "./markdown";
import { MARKDOWN_EDITOR_NODES } from "./nodes";

const convertAll = (
  text: string,
  kind: Parameters<typeof $setBlockKind>[0],
) => {
  const editor = createEditor({
    namespace: "blocks-test",
    nodes: [...MARKDOWN_EDITOR_NODES],
    onError: (error) => {
      throw error;
    },
  });
  editor.update(
    () => {
      $importMarkdown($getRoot(), text);
      $getRoot().select(0, $getRoot().getChildrenSize());
      $setBlockKind(kind);
    },
    { discrete: true },
  );
  return editor.read(() =>
    $getRoot()
      .getChildren()
      .map((node) => `${node.getType()}:${node.getTextContent()}`),
  );
};

describe("$setBlockKind", () => {
  it("leaves tables alone when the selection crosses one", () => {
    expect(convertAll("Intro\n\n| a |\n|---|\n| 1 |\n", "h1")).toEqual([
      "heading:Intro",
      expect.stringMatching(/^table:/),
    ]);
  });

  it("converts every selected list, not just the one holding the anchor", () => {
    expect(convertAll("Intro\n\n- one\n- two\n", "quote")).toEqual([
      "quote:Intro",
      "quote:one",
      "quote:two",
    ]);
  });
});
