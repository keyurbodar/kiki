import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getNearestNodeFromDOMNode,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  BLUR_COMMAND,
  CLICK_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  COMMAND_PRIORITY_HIGH,
  KEY_ESCAPE_COMMAND,
  type LexicalEditor,
  mergeRegister,
} from "lexical";
import { lazy, Suspense, useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/primitives/button";
import { $isMarkdownSourceNode, type SourceKind } from "../nodes";
import { DefinitionMarker } from "./definition-marker";

const SourceBlockPreview = lazy(() =>
  import("./source-block-preview").then((module) => ({
    default: module.SourceBlockPreview,
  })),
);

export const COLLAPSED_LINES = 3;

export const SOURCE_KIND_LABELS: Record<SourceKind, string> = {
  mermaid: "mermaid",
  math: "math",
  html: "html",
  footnote: "footnote",
  frontmatter: "Properties",
  reference: "reference",
  definition: "definition",
  plain: "markdown",
};

export type SourceBlock = {
  key: string;
  kind: SourceKind;
  text: string;
  host: HTMLElement;
};

type PreviewState = {
  blocks: SourceBlock[];
  editing: string | null;
  definitions: string;
};

const INTERACTIVE =
  "a, button, summary, input, textarea, select, [role='button']";

export const $readSourceBlocks = (editor: LexicalEditor): PreviewState => {
  const selection = $getSelection();
  const focused = $isRangeSelection(selection)
    ? selection.anchor.getNode().getTopLevelElement()
    : null;
  const blocks = $getRoot()
    .getChildren()
    .flatMap((node): SourceBlock[] => {
      if (!$isMarkdownSourceNode(node)) return [];
      const host = editor
        .getElementByKey(node.getKey())
        ?.querySelector(':scope > [data-slot="chrome"]');
      return host instanceof HTMLElement
        ? [
            {
              key: node.getKey(),
              kind: node.getKind(),
              text: node.getTextContent(),
              host,
            },
          ]
        : [];
    });
  return {
    blocks,
    editing: $isMarkdownSourceNode(focused) ? focused.getKey() : null,
    definitions: blocks
      .flatMap((block) => (block.kind === "definition" ? [block.text] : []))
      .join("\n\n"),
  };
};

export const sameBlocks = (a: SourceBlock[], b: SourceBlock[]) =>
  a.length === b.length &&
  a.every(
    (block, index) =>
      block.key === b[index]?.key &&
      block.text === b[index]?.text &&
      block.kind === b[index]?.kind &&
      block.host === b[index]?.host,
  );

export const isCollapsible = (block: Pick<SourceBlock, "kind" | "text">) =>
  block.kind === "frontmatter" &&
  block.text.split("\n").length > COLLAPSED_LINES;

const $editFromChrome = (target: EventTarget | null) => {
  if (!(target instanceof Element)) return false;
  const chrome = target.closest('[data-slot="chrome"]');
  if (chrome === null || target.closest(INTERACTIVE) !== null) return false;
  const node = $getNearestNodeFromDOMNode(chrome);
  if (!$isMarkdownSourceNode(node)) return false;
  node.selectEnd();
  return true;
};

const preventMouseDown = (event: { preventDefault: () => void }) =>
  event.preventDefault();

export function PreviewBlocksPlugin() {
  const [editor] = useLexicalComposerContext();
  const id = useId();
  const [state, setState] = useState<PreviewState>({
    blocks: [],
    editing: null,
    definitions: "",
  });
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(
    () => new Set(),
  );

  useEffect(() => {
    const update = (next: PreviewState) =>
      setState((current) =>
        sameBlocks(current.blocks, next.blocks) &&
        current.editing === next.editing &&
        current.definitions === next.definitions
          ? current
          : next,
      );
    update(editor.getEditorState().read(() => $readSourceBlocks(editor)));
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) =>
        update(editorState.read(() => $readSourceBlocks(editor))),
      ),
      editor.registerCommand(
        BLUR_COMMAND,
        () => {
          setState((current) =>
            current.editing === null ? current : { ...current, editing: null },
          );
          return false;
        },
        COMMAND_PRIORITY_HIGH,
      ),
      editor.registerCommand(
        CLICK_COMMAND,
        (event) => $editFromChrome(event.target),
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerCommand(
        KEY_ESCAPE_COMMAND,
        () => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection)) return false;
          const block = selection.anchor.getNode().getTopLevelElement();
          if (
            !$isMarkdownSourceNode(block) ||
            block.getKind() === "frontmatter"
          )
            return false;
          editor.blur();
          return true;
        },
        COMMAND_PRIORITY_HIGH,
      ),
    );
  }, [editor]);

  useEffect(() => {
    for (const block of state.blocks) {
      const element = block.host.parentElement;
      if (element === null) continue;
      const editing = state.editing === block.key;
      element.toggleAttribute("data-editing", editing);
      element.toggleAttribute(
        "data-collapsed",
        isCollapsible(block) && !editing && !expanded.has(block.key),
      );
    }
    return () => {
      for (const block of state.blocks) {
        block.host.parentElement?.removeAttribute("data-editing");
        block.host.parentElement?.removeAttribute("data-collapsed");
      }
    };
  }, [state, expanded]);

  return state.blocks.map((block) => {
    const editing = state.editing === block.key;
    const label = SOURCE_KIND_LABELS[block.kind];
    const portalKey = `${id}:${block.key}`;
    if (block.kind === "frontmatter") {
      const open = editing || expanded.has(block.key);
      return createPortal(
        <div data-slot="markdown-code-header">
          <span data-slot="markdown-code-language">{label}</span>
          {isCollapsible(block) && !editing ? (
            <Button
              variant="ghost"
              size="xs"
              aria-expanded={open}
              onMouseDown={preventMouseDown}
              onClick={() =>
                setExpanded((current) => {
                  const next = new Set(current);
                  if (next.has(block.key)) next.delete(block.key);
                  else next.add(block.key);
                  return next;
                })
              }
            >
              {open ? "Show less" : "Show all"}
            </Button>
          ) : null}
        </div>,
        block.host,
        portalKey,
      );
    }
    if (editing)
      return createPortal(
        <div data-slot="markdown-code-header">
          <span data-slot="markdown-code-language">{label}</span>
        </div>,
        block.host,
        portalKey,
      );
    if (block.kind === "definition")
      return createPortal(
        <DefinitionMarker text={block.text} />,
        block.host,
        portalKey,
      );
    return createPortal(
      <Suspense fallback={<pre data-slot="preview-source">{block.text}</pre>}>
        <SourceBlockPreview
          kind={block.kind}
          text={block.text}
          definitions={state.definitions}
        />
      </Suspense>,
      block.host,
      portalKey,
    );
  });
}
