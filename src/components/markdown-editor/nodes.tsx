import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { HorizontalRuleNode } from "@lexical/extension";
import { LinkNode } from "@lexical/link";
import { $isListNode, ListItemNode, ListNode } from "@lexical/list";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";
import {
  $applyNodeReplacement,
  $createLineBreakNode,
  $createParagraphNode,
  $createTextNode,
  $getState,
  $isTextNode,
  $setState,
  createState,
  DecoratorNode,
  type DOMExportOutput,
  ElementNode,
  type Klass,
  type LexicalNode,
  type LexicalNodeReplacement,
  type NodeKey,
  type RangeSelection,
  type SerializedElementNode,
  type SerializedLexicalNode,
  setDOMUnmanaged,
} from "lexical";
import type { JSX } from "react";

export type TableAlign = "left" | "center" | "right" | null;

export type SourceSpan = {
  slice: string;
  fingerprint: string;
  gap: string;
  start: number;
  end: number;
};

export type DocumentFrame = {
  prefix: string;
  suffix: string;
  newline: "\n" | "\r\n";
};

export type CodeFence = { fence: string; meta: string };

export const SOURCE_KINDS = [
  "mermaid",
  "math",
  "html",
  "footnote",
  "frontmatter",
  "reference",
  "definition",
  "plain",
] as const;

export type SourceKind = (typeof SOURCE_KINDS)[number];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isSourceSpan = (value: unknown): value is SourceSpan =>
  isRecord(value) &&
  typeof value.slice === "string" &&
  typeof value.fingerprint === "string" &&
  typeof value.gap === "string" &&
  typeof value.start === "number" &&
  typeof value.end === "number";

const isDocumentFrame = (value: unknown): value is DocumentFrame =>
  isRecord(value) &&
  typeof value.prefix === "string" &&
  typeof value.suffix === "string" &&
  (value.newline === "\n" || value.newline === "\r\n");

const isCodeFence = (value: unknown): value is CodeFence =>
  isRecord(value) &&
  typeof value.fence === "string" &&
  typeof value.meta === "string";

const isTableAlign = (value: unknown): value is TableAlign =>
  value === null || value === "left" || value === "center" || value === "right";

const isSourceKind = (value: unknown): value is SourceKind =>
  SOURCE_KINDS.includes(value as SourceKind);

export const sourceSpanState = createState("markdownSource", {
  parse: (value) => (isSourceSpan(value) ? value : undefined),
});

export const documentFrameState = createState("markdownDocument", {
  parse: (value) => (isDocumentFrame(value) ? value : undefined),
});

export const codeFenceState = createState("markdownFence", {
  parse: (value) => (isCodeFence(value) ? value : undefined),
});

export const tableAlignState = createState("markdownTableAlign", {
  parse: (value): TableAlign[] =>
    Array.isArray(value) ? value.filter(isTableAlign) : [],
});

const sourceKindState = createState("markdownSourceKind", {
  parse: (value): SourceKind => (isSourceKind(value) ? value : "plain"),
});

export class MarkdownSourceNode extends ElementNode {
  static getType() {
    return "markdown-source";
  }

  static clone(node: MarkdownSourceNode) {
    return new MarkdownSourceNode(node.__key);
  }

  static importJSON(json: SerializedElementNode) {
    return $createMarkdownSourceNode().updateFromJSON(json);
  }

  createDOM() {
    const block = document.createElement("div");
    block.setAttribute("data-source-block", "");
    block.setAttribute("data-kind", $getState(this, sourceKindState));
    const pre = document.createElement("pre");
    pre.setAttribute("spellcheck", "false");
    const chrome = document.createElement("div");
    chrome.setAttribute("data-slot", "chrome");
    chrome.setAttribute("contenteditable", "false");
    setDOMUnmanaged(chrome);
    block.append(pre, chrome);
    return block;
  }

  updateDOM() {
    return false;
  }

  getDOMSlot(element: HTMLElement) {
    const pre = element.querySelector(":scope > pre");
    return super
      .getDOMSlot(element)
      .withElement(pre instanceof HTMLElement ? pre : element);
  }

  getKind(): SourceKind {
    return $getState(this, sourceKindState);
  }

  canIndent() {
    return false;
  }

  insertNewAfter(selection: RangeSelection) {
    const anchor = selection.anchor;
    const node = anchor.getNode();
    if ($isTextNode(node)) {
      const index =
        (node.splitText(anchor.offset)[0] ?? node).getIndexWithinParent() +
        (anchor.offset === 0 ? 0 : 1);
      const lineBreak = $createLineBreakNode();
      this.splice(index, 0, [lineBreak]);
      lineBreak.selectNext(0, 0);
      return null;
    }
    if (node === this) {
      this.splice(anchor.offset, 0, [$createLineBreakNode()]);
      this.select(anchor.offset + 1, anchor.offset + 1);
    }
    return null;
  }

  collapseAtStart() {
    const paragraph = $createParagraphNode();
    paragraph.append(...this.getChildren());
    this.replace(paragraph);
    return true;
  }
}

export const $appendSourceText = <T extends ElementNode>(
  node: T,
  text: string,
): T => {
  text.split(/\r\n|\r|\n/).forEach((line, index) => {
    if (index > 0) node.append($createLineBreakNode());
    if (line.length > 0) node.append($createTextNode(line));
  });
  return node;
};

export const $createMarkdownSourceNode = (
  text = "",
  kind: SourceKind = "plain",
) => {
  const node = $applyNodeReplacement(new MarkdownSourceNode());
  $setState(node, sourceKindState, kind);
  return $appendSourceText(node, text);
};

export const $isMarkdownSourceNode = (
  node: LexicalNode | null | undefined,
): node is MarkdownSourceNode => node instanceof MarkdownSourceNode;

type SerializedMarkdownImageNode = SerializedLexicalNode & {
  src: string;
  alt: string;
  title: string | null;
};

export class MarkdownImageNode extends DecoratorNode<JSX.Element> {
  __src: string;
  __alt: string;
  __title: string | null;

  static getType() {
    return "markdown-image";
  }

  static clone(node: MarkdownImageNode) {
    return new MarkdownImageNode(
      node.__src,
      node.__alt,
      node.__title,
      node.__key,
    );
  }

  static importJSON(json: SerializedMarkdownImageNode) {
    return $createMarkdownImageNode(json.src, json.alt, json.title);
  }

  constructor(src = "", alt = "", title: string | null = null, key?: NodeKey) {
    super(key);
    this.__src = src;
    this.__alt = alt;
    this.__title = title;
  }

  exportJSON(): SerializedMarkdownImageNode {
    return {
      ...super.exportJSON(),
      src: this.__src,
      alt: this.__alt,
      title: this.__title,
    };
  }

  createDOM() {
    return document.createElement("span");
  }

  updateDOM() {
    return false;
  }

  exportDOM(): DOMExportOutput {
    const image = document.createElement("img");
    image.setAttribute("src", this.__src);
    image.setAttribute("alt", this.__alt);
    if (this.__title !== null) image.setAttribute("title", this.__title);
    return { element: image };
  }

  getSrc() {
    return this.getLatest().__src;
  }

  getAlt() {
    return this.getLatest().__alt;
  }

  getTitle() {
    return this.getLatest().__title;
  }

  getTextContent() {
    return this.getAlt();
  }

  isInline() {
    return true;
  }

  isKeyboardSelectable() {
    return true;
  }

  decorate() {
    return (
      <img
        src={this.__src}
        alt={this.__alt}
        title={this.__title ?? undefined}
        draggable={false}
      />
    );
  }
}

export const $createMarkdownImageNode = (
  src: string,
  alt: string,
  title: string | null,
) => $applyNodeReplacement(new MarkdownImageNode(src, alt, title));

export const $isMarkdownImageNode = (
  node: LexicalNode | null | undefined,
): node is MarkdownImageNode => node instanceof MarkdownImageNode;

export const $getListItemChecked = (node: ListItemNode) =>
  $isListNode(node.getParent()) ? node.getChecked() : undefined;

const decoration = (attribute: string) => {
  const span = document.createElement("span");
  span.setAttribute(attribute, "");
  span.setAttribute("contenteditable", "false");
  setDOMUnmanaged(span);
  return span;
};

export class MarkdownListItemNode extends ListItemNode {
  static getType() {
    return "markdown-listitem";
  }

  static clone(node: MarkdownListItemNode) {
    return new MarkdownListItemNode(node.__value, node.__checked, node.__key);
  }

  static importJSON(json: ReturnType<ListItemNode["exportJSON"]>) {
    return new MarkdownListItemNode().updateFromJSON(json);
  }

  exportJSON() {
    return { ...super.exportJSON(), checked: $getListItemChecked(this) };
  }

  createDOM(config: Parameters<ListItemNode["createDOM"]>[0]) {
    const element = super.createDOM(config);
    this.updateCheckDOM(element);
    return element;
  }

  updateDOM(
    prevNode: this,
    element: HTMLElement,
    config: Parameters<ListItemNode["updateDOM"]>[2],
  ) {
    super.updateDOM(prevNode, element, config);
    this.updateCheckDOM(element);
    return false;
  }

  getDOMSlot(element: HTMLElement) {
    return super
      .getDOMSlot(element)
      .withAfter(element.querySelector(":scope > [data-check-box]"));
  }

  updateCheckDOM(element: HTMLElement) {
    const checked = $getListItemChecked(this);
    const box = element.querySelector(":scope > [data-check-box]");
    if (checked === undefined || $isListNode(this.getFirstChild())) {
      box?.remove();
      element.removeAttribute("role");
      element.removeAttribute("aria-checked");
      element.removeAttribute("tabindex");
      return;
    }
    const input =
      box?.querySelector("input") ?? document.createElement("input");
    input.type = "checkbox";
    input.disabled = true;
    input.checked = checked;
    if (box !== null) return;
    const wrapper = decoration("data-check-box");
    wrapper.append(input, " ");
    element.prepend(wrapper);
  }
}

export const $isMarkdownListItemNode = (
  node: LexicalNode | null | undefined,
): node is MarkdownListItemNode => node instanceof MarkdownListItemNode;

export const MARKDOWN_EDITOR_NODES: ReadonlyArray<
  Klass<LexicalNode> | LexicalNodeReplacement
> = [
  HeadingNode,
  QuoteNode,
  ListNode,
  ListItemNode,
  {
    replace: ListItemNode,
    with: (node: ListItemNode) =>
      new MarkdownListItemNode(node.__value, node.__checked),
    withKlass: MarkdownListItemNode,
  },
  MarkdownListItemNode,
  CodeNode,
  CodeHighlightNode,
  LinkNode,
  HorizontalRuleNode,
  TableNode,
  TableRowNode,
  TableCellNode,
  MarkdownImageNode,
  MarkdownSourceNode,
];
