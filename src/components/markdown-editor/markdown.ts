import { $createCodeNode, $isCodeNode } from "@lexical/code";
import {
  $createHorizontalRuleNode,
  $isHorizontalRuleNode,
} from "@lexical/extension";
import { $createLinkNode, $isLinkNode } from "@lexical/link";
import {
  $createListItemNode,
  $createListNode,
  $isListItemNode,
  $isListNode,
  type ListNode,
} from "@lexical/list";
import {
  $createHeadingNode,
  $createQuoteNode,
  $isHeadingNode,
  $isQuoteNode,
} from "@lexical/rich-text";
import {
  $createTableCellNode,
  $createTableNode,
  $createTableRowNode,
  $isTableCellNode,
  $isTableNode,
  $isTableRowNode,
  TableCellHeaderStates,
  type TableNode,
} from "@lexical/table";
import {
  $createLineBreakNode,
  $createParagraphNode,
  $createTextNode,
  $getState,
  $isElementNode,
  $isLineBreakNode,
  $isTextNode,
  $setState,
  type ElementNode,
  type LexicalNode,
  type RootNode,
  type TextFormatType,
} from "lexical";
import type {
  Delete,
  Emphasis,
  List,
  Nodes,
  PhrasingContent,
  Root,
  RootContent,
  Strong,
  Table,
} from "mdast";
import {
  type Options as ToMarkdownOptions,
  toMarkdown,
} from "mdast-util-to-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkParse from "remark-parse";
import { unified } from "unified";
import {
  $appendSourceText,
  $createMarkdownImageNode,
  $createMarkdownSourceNode,
  $getListItemChecked,
  $isMarkdownImageNode,
  $isMarkdownSourceNode,
  codeFenceState,
  type DocumentFrame,
  documentFrameState,
  type SourceKind,
  sourceSpanState,
  type TableAlign,
  tableAlignState,
} from "./nodes";

const parser = unified()
  .use(remarkParse)
  .use(remarkGfm, { singleTilde: false })
  .use(remarkMath, { singleDollarTextMath: false })
  .freeze();

const toMarkdownExtensions =
  (parser.data() as { toMarkdownExtensions?: ToMarkdownOptions[] })
    .toMarkdownExtensions ?? [];

type LineBreak = "break" | "space";

type FormatNode = Emphasis | Strong | Delete;

const INLINE_FORMATS = ["bold", "italic", "strikethrough"] as const;

const FORMAT_NODE = {
  bold: "strong",
  italic: "emphasis",
  strikethrough: "delete",
} as const;

const $phrasing = (
  element: ElementNode,
  lineBreak: LineBreak,
): PhrasingContent[] => {
  const out: PhrasingContent[] = [];
  const open: FormatNode[] = [];
  let pending = "";
  const push = (node: PhrasingContent) =>
    (open.at(-1)?.children ?? out).push(node);
  const flush = () => {
    open.length = 0;
    if (pending.length > 0) push({ type: "text", value: pending });
    pending = "";
  };
  for (const child of element.getChildren()) {
    if ($isLineBreakNode(child)) {
      flush();
      push(
        lineBreak === "space"
          ? { type: "text", value: " " }
          : { type: "break" },
      );
      continue;
    }
    if ($isMarkdownImageNode(child)) {
      flush();
      push({
        type: "image",
        url: child.getSrc(),
        alt: child.getAlt(),
        title: child.getTitle(),
      });
      continue;
    }
    if ($isLinkNode(child)) {
      flush();
      push({
        type: "link",
        url: child.getURL(),
        title: child.getTitle(),
        children: $phrasing(child, "space"),
      });
      continue;
    }
    if ($isElementNode(child)) {
      flush();
      out.push(...$phrasing(child, lineBreak));
      continue;
    }
    const text = child.getTextContent();
    const code = $isTextNode(child) && child.hasFormat("code");
    const lead = code ? "" : (text.match(/^\s*/)?.[0] ?? "");
    const trail = code
      ? ""
      : (text.slice(lead.length).match(/\s*$/)?.[0] ?? "");
    const core = text.slice(lead.length, text.length - trail.length);
    if (core.length === 0) {
      pending += text;
      continue;
    }
    const formats = INLINE_FORMATS.filter(
      (format) => $isTextNode(child) && child.hasFormat(format),
    ).map((format) => FORMAT_NODE[format]);
    while (open.some((node, index) => formats[index] !== node.type)) open.pop();
    if (pending.length + lead.length > 0)
      push({ type: "text", value: pending + lead });
    pending = trail;
    for (const type of formats.slice(open.length)) {
      const node: FormatNode = { type, children: [] };
      push(node);
      open.push(node);
    }
    push(
      code
        ? { type: "inlineCode", value: core }
        : { type: "text", value: core },
    );
  }
  flush();
  return out;
};

const $inlineMarkdown = (element: ElementNode, lineBreak: LineBreak) =>
  toMarkdown(
    {
      type: "root",
      children: [
        { type: "paragraph", children: $phrasing(element, lineBreak) },
      ],
    },
    { extensions: toMarkdownExtensions },
  ).slice(0, -1);

const $listMarkdown = (list: ListNode, indent: string): string => {
  const type = list.getListType();
  let number = list.getStart();
  let nested = `${indent}    `;
  const lines: string[] = [];
  for (const item of list.getChildren()) {
    if (!$isListItemNode(item)) continue;
    const first = item.getFirstChild();
    if ($isListNode(first) && item.getChildrenSize() === 1) {
      lines.push($listMarkdown(first, nested));
      continue;
    }
    const checked = $getListItemChecked(item);
    const marker =
      type === "number"
        ? `${number++}. `
        : type === "check" && checked !== undefined
          ? `- [${checked ? "x" : " "}] `
          : "- ";
    nested = `${indent}${" ".repeat(Math.max(4, marker.length))}`;
    const body = $inlineMarkdown(item, "break")
      .split("\n")
      .map((line, index) => (index === 0 ? line : `${nested}${line}`))
      .join("\n");
    lines.push(
      `${indent}${body.length === 0 ? marker.trimEnd() : marker + body}`,
    );
  }
  return lines.join("\n");
};

const segmenter = new Intl.Segmenter();
const WIDE =
  /^(?:\p{Emoji_Presentation}|[\u1100-\u115F\u2E80-\u303E\u3041-\u33FF\u3400-\u4DBF\u4E00-\u9FFF\uA000-\uA4CF\uAC00-\uD7A3\uF900-\uFAFF\uFE30-\uFE4F\uFF00-\uFF60\uFFE0-\uFFE6]|[\u{20000}-\u{3FFFD}])/u;

export const displayWidth = (text: string) => {
  let width = 0;
  for (const { segment } of segmenter.segment(text))
    width += WIDE.test(segment) ? 2 : 1;
  return width;
};

const $tableMarkdown = (table: TableNode) => {
  const align = $getState(table, tableAlignState);
  const rows = table
    .getChildren()
    .filter($isTableRowNode)
    .map((row) =>
      row.getChildren().map((cell) =>
        ($isElementNode(cell) ? cell.getChildren() : [])
          .map((block) =>
            $isElementNode(block) ? $inlineMarkdown(block, "space") : "",
          )
          .join(" ")
          .trim()
          .replaceAll("|", "\\|"),
      ),
    );
  const columns = rows.reduce((max, row) => Math.max(max, row.length), 0);
  const widths = Array.from({ length: columns }, (_, column) =>
    rows.reduce(
      (max, row) => Math.max(max, displayWidth(row[column] ?? "")),
      3,
    ),
  );
  const pad = (text: string, column: number) => {
    const space = (widths[column] ?? 0) - displayWidth(text);
    const side = align[column] ?? null;
    if (side === "right") return `${" ".repeat(space)}${text}`;
    if (side === "center")
      return `${" ".repeat(Math.floor(space / 2))}${text}${" ".repeat(Math.ceil(space / 2))}`;
    return `${text}${" ".repeat(space)}`;
  };
  const line = (cells: string[]) =>
    `| ${cells.map((cell, column) => pad(cell, column)).join(" | ")} |`;
  const delimiter = widths.map((width, column) => {
    const side = align[column] ?? null;
    if (side === null) return "-".repeat(width);
    if (side === "left") return `:${"-".repeat(width - 1)}`;
    if (side === "right") return `${"-".repeat(width - 1)}:`;
    return `:${"-".repeat(width - 2)}:`;
  });
  const [head = [], ...body] = rows;
  const fill = (row: string[]) =>
    Array.from({ length: columns }, (_, column) => row[column] ?? "");
  return [
    line(fill(head)),
    `| ${delimiter.join(" | ")} |`,
    ...body.map((row) => line(fill(row))),
  ].join("\n");
};

const longestRun = (text: string, char: string) =>
  (text.match(new RegExp(`\\${char}+`, "g")) ?? []).reduce(
    (max, run) => Math.max(max, run.length),
    0,
  );

export const $blockMarkdown = (node: LexicalNode): string => {
  if ($isMarkdownSourceNode(node)) return node.getTextContent();
  if ($isHorizontalRuleNode(node)) return "---";
  if ($isHeadingNode(node))
    return `${"#".repeat(Number(node.getTag().slice(1)))} ${$inlineMarkdown(node, "space")}`.trimEnd();
  if ($isQuoteNode(node))
    return $inlineMarkdown(node, "break")
      .split("\n")
      .map((line) => (line.length === 0 ? ">" : `> ${line}`))
      .join("\n");
  if ($isListNode(node)) return $listMarkdown(node, "");
  if ($isTableNode(node)) return $tableMarkdown(node);
  if ($isCodeNode(node)) {
    const text = node.getTextContent();
    const fence = $getState(node, codeFenceState);
    const char = fence?.fence.startsWith("~") ? "~" : "`";
    const marker = char.repeat(
      Math.max(fence?.fence.length ?? 3, longestRun(text, char) + 1, 3),
    );
    const meta = fence?.meta ?? "";
    const info = `${node.getLanguage() ?? ""}${meta.length > 0 ? ` ${meta}` : ""}`;
    return `${marker}${info}\n${text}${text.length > 0 ? "\n" : ""}${marker}`;
  }
  return $isElementNode(node)
    ? $inlineMarkdown(node, "break")
    : node.getTextContent();
};

export type MarkdownExport = {
  text: string;
  spans: Array<[number, number]>;
};

export const $exportMarkdown = (root: RootNode): MarkdownExport => {
  const frame = $getState(root, documentFrameState);
  const newline = frame?.newline ?? "\n";
  const children = root.getChildren();
  const spans: Array<[number, number]> = [];
  let text = frame?.prefix ?? "";
  let line = text.split("\n").length - 1;
  children.forEach((child, index) => {
    const source = $getState(child, sourceSpanState);
    const markdown = $blockMarkdown(child);
    const chunk =
      source?.fingerprint === markdown
        ? source.slice
        : markdown.replaceAll("\n", newline);
    const lines = chunk.split("\n").length - 1;
    spans.push([line + 1, line + 1 + lines]);
    text += chunk;
    line += lines;
    const next = children[index + 1];
    if (next === undefined) return;
    const nextSource = $getState(next, sourceSpanState);
    const gap =
      source !== undefined &&
      source.end + source.gap.length === nextSource?.start
        ? source.gap
        : `${newline}${newline}`;
    text += gap;
    line += gap.split("\n").length - 1;
  });
  return {
    text: text + (frame?.suffix ?? (children.length > 0 ? newline : "")),
    spans,
  };
};

type Frontmatter = {
  type: "frontmatter";
  position: { start: { offset: number }; end: { offset: number } };
};

type Block = RootContent | Frontmatter;

const FRONTMATTER =
  /^(---|\+\+\+)[ \t]*\r?\n(?:[\s\S]*?\r?\n)?\1[ \t]*(?=\r?\n|$)/;

const parseBlocks = (text: string): Block[] => {
  const frontmatter = FRONTMATTER.exec(text)?.[0];
  if (frontmatter === undefined) return parser.parse(text).children;
  const blank = frontmatter.replace(/[^\r\n]/g, " ");
  const root: Root = parser.parse(blank + text.slice(frontmatter.length));
  return [
    {
      type: "frontmatter",
      position: { start: { offset: 0 }, end: { offset: frontmatter.length } },
    },
    ...root.children,
  ];
};

const startOf = (node: Block | Nodes) => node.position?.start.offset ?? 0;
const endOf = (node: Block | Nodes) => node.position?.end.offset ?? 0;

const REFERENCE_KINDS: Array<[string, SourceKind]> = [
  ["footnoteReference", "footnote"],
  ["linkReference", "reference"],
  ["imageReference", "reference"],
  ["html", "html"],
];

const collectTypes = (node: Nodes, types: Set<string>) => {
  types.add(node.type);
  if ("children" in node)
    for (const child of node.children) collectTypes(child, types);
  return types;
};

export const sourceKindOf = (block: Block): SourceKind => {
  switch (block.type) {
    case "frontmatter":
      return "frontmatter";
    case "code":
      return block.lang === "mermaid" ? "mermaid" : "plain";
    case "math":
      return "math";
    case "html":
      return "html";
    case "definition":
    case "footnoteDefinition":
      return "definition";
    default: {
      const types = collectTypes(block, new Set());
      return REFERENCE_KINDS.find(([type]) => types.has(type))?.[1] ?? "plain";
    }
  }
};

const FORMAT_OF = {
  emphasis: "italic",
  strong: "bold",
  delete: "strikethrough",
} as const;

export const $importMarkdown = (root: RootNode, text: string) => {
  const blocks = parseBlocks(text);
  const sliceOf = (node: Block | Nodes) =>
    text.slice(startOf(node), endOf(node));

  const isSimpleInline = (nodes: PhrasingContent[]): boolean =>
    nodes.every((node) => {
      switch (node.type) {
        case "text":
        case "inlineCode":
        case "break":
        case "image":
          return true;
        case "emphasis":
        case "strong":
        case "delete":
          return isSimpleInline(node.children);
        case "link": {
          const source = sliceOf(node);
          return (
            (source.startsWith("[") || source === node.url) &&
            isSimpleInline(node.children)
          );
        }
        default:
          return false;
      }
    });

  const isSimpleItem = (item: List["children"][number]) => {
    const [first, second, ...rest] = item.children;
    if (rest.length > 0) return false;
    if (first === undefined) return true;
    if (first.type === "list")
      return second === undefined && isSimpleList(first);
    if (first.type !== "paragraph" || !isSimpleInline(first.children))
      return false;
    return (
      second === undefined || (second.type === "list" && isSimpleList(second))
    );
  };

  const isSimpleList = (list: List): boolean => {
    if (!list.children.every(isSimpleItem)) return false;
    if (list.ordered && list.children.some((item) => item.checked != null))
      return false;
    const checked = list.children.map((item) => item.checked != null);
    return checked.every((item) => item === checked[0]);
  };

  const isSimpleTable = (table: Table) => {
    const [head, ...rows] = table.children;
    return (
      head !== undefined &&
      rows.every((row) => row.children.length <= head.children.length) &&
      table.children.every((row) =>
        row.children.every((cell) => isSimpleInline(cell.children)),
      )
    );
  };

  const $append = (
    element: ElementNode,
    nodes: PhrasingContent[],
    formats: TextFormatType[],
  ) => {
    for (const node of nodes) {
      switch (node.type) {
        case "text":
        case "inlineCode": {
          const textNode = $createTextNode(
            node.type === "inlineCode"
              ? node.value
              : node.value.replace(/\r?\n/g, " "),
          );
          for (const format of node.type === "inlineCode"
            ? [...formats, "code" as const]
            : formats)
            if (!textNode.hasFormat(format)) textNode.toggleFormat(format);
          element.append(textNode);
          break;
        }
        case "break":
          element.append($createLineBreakNode());
          break;
        case "image":
          element.append(
            $createMarkdownImageNode(
              node.url,
              node.alt ?? "",
              node.title ?? null,
            ),
          );
          break;
        case "emphasis":
        case "strong":
        case "delete":
          $append(element, node.children, [...formats, FORMAT_OF[node.type]]);
          break;
        case "link": {
          const link = $createLinkNode(node.url, { title: node.title ?? null });
          $append(link, node.children, formats);
          element.append(link);
          break;
        }
      }
    }
  };

  const $list = (list: List): ListNode => {
    const checks = list.children.some((item) => item.checked != null);
    const node = $createListNode(
      list.ordered ? "number" : checks ? "check" : "bullet",
      list.start ?? 1,
    );
    for (const item of list.children) {
      const [first, second] = item.children;
      if (first !== undefined && first.type !== "list") {
        const listItem = $createListItemNode(
          checks ? (item.checked ?? undefined) : undefined,
        );
        $append(listItem, first.type === "paragraph" ? first.children : [], []);
        node.append(listItem);
      }
      if (first === undefined || first.type === "list")
        node.append($createListItemNode());
      const nested =
        first?.type === "list"
          ? first
          : second?.type === "list"
            ? second
            : undefined;
      if (nested !== undefined)
        node.append($createListItemNode().append($list(nested)));
    }
    return node;
  };

  const $block = (block: Block): LexicalNode => {
    switch (block.type) {
      case "heading": {
        if (!isSimpleInline(block.children)) break;
        const heading = $createHeadingNode(`h${block.depth}`);
        $append(heading, block.children, []);
        return heading;
      }
      case "paragraph": {
        if (!isSimpleInline(block.children)) break;
        const paragraph = $createParagraphNode();
        $append(paragraph, block.children, []);
        return paragraph;
      }
      case "blockquote": {
        const [first, ...rest] = block.children;
        if (
          first?.type !== "paragraph" ||
          rest.length > 0 ||
          !isSimpleInline(first.children)
        )
          break;
        const quote = $createQuoteNode();
        $append(quote, first.children, []);
        return quote;
      }
      case "list":
        if (!isSimpleList(block)) break;
        return $list(block);
      case "code": {
        if (block.lang === "mermaid") break;
        const code = $appendSourceText(
          $createCodeNode(block.lang),
          block.value,
        );
        const fence = sliceOf(block).match(/^(`{3,}|~{3,})/)?.[1] ?? "```";
        $setState(code, codeFenceState, { fence, meta: block.meta ?? "" });
        return code;
      }
      case "thematicBreak":
        return $createHorizontalRuleNode();
      case "table": {
        if (!isSimpleTable(block)) break;
        const table = $createTableNode();
        const columns = block.children[0]?.children.length ?? 0;
        block.children.forEach((row, rowIndex) => {
          const tableRow = $createTableRowNode();
          for (let column = 0; column < columns; column += 1) {
            const cell = $createTableCellNode(
              rowIndex === 0
                ? TableCellHeaderStates.ROW
                : TableCellHeaderStates.NO_STATUS,
            );
            const paragraph = $createParagraphNode();
            $append(paragraph, row.children[column]?.children ?? [], []);
            tableRow.append(cell.append(paragraph));
          }
          table.append(tableRow);
        });
        $setTableAlign(table, block.align ?? []);
        return table;
      }
    }
    return $createMarkdownSourceNode(sliceOf(block), sourceKindOf(block));
  };

  root.clear();
  const first = blocks[0];
  const last = blocks.at(-1);
  const frame: DocumentFrame = {
    prefix: first === undefined ? "" : text.slice(0, startOf(first)),
    suffix: last === undefined ? text : text.slice(endOf(last)),
    newline: text.includes("\r\n") ? "\r\n" : "\n",
  };
  $setState(root, documentFrameState, frame);
  blocks.forEach((block, index) => {
    const node = $block(block);
    const next = blocks[index + 1];
    $setState(node, sourceSpanState, {
      slice: sliceOf(block),
      fingerprint: $blockMarkdown(node),
      start: startOf(block),
      end: endOf(block),
      gap: next === undefined ? "" : text.slice(endOf(block), startOf(next)),
    });
    root.append(node);
  });
};

export const $setTableAlign = (table: TableNode, align: TableAlign[]) => {
  $setState(table, tableAlignState, align);
  for (const row of table.getChildren()) {
    if (!$isTableRowNode(row)) continue;
    row.getChildren().forEach((cell, column) => {
      if (!$isTableCellNode(cell)) return;
      for (const block of cell.getChildren())
        if ($isElementNode(block)) block.setFormat(align[column] ?? "");
    });
  }
};
