import { $createCodeNode, $isCodeNode } from "@lexical/code";
import { $createHorizontalRuleNode } from "@lexical/extension";
import {
  $insertList,
  $isListNode,
  $removeList,
  ListItemNode,
  ListNode,
} from "@lexical/list";
import {
  $createHeadingNode,
  $createQuoteNode,
  $isHeadingNode,
  $isQuoteNode,
} from "@lexical/rich-text";
import {
  $createTableNodeWithDimensions,
  $getTableCellNodeFromLexicalNode,
  $isTableCellNode,
  $isTableNode,
  $isTableRowNode,
  $isTableSelection,
  TableCellHeaderStates,
  type TableCellNode,
  type TableNode,
} from "@lexical/table";
import { $getNearestNodeOfType } from "@lexical/utils";
import {
  $createParagraphNode,
  $getRoot,
  $getSelection,
  $getState,
  $isElementNode,
  $isRangeSelection,
  $isTextNode,
  type ElementNode,
  type LexicalNode,
} from "lexical";
import type { EditorIconName } from "./icons";
import { $setTableAlign } from "./markdown";
import { $getListItemChecked, type TableAlign, tableAlignState } from "./nodes";

export type BlockKind =
  | "paragraph"
  | "h1"
  | "h2"
  | "h3"
  | "bullet"
  | "number"
  | "check"
  | "quote"
  | "code";

export type BlockType = {
  kind: BlockKind;
  label: string;
  icon: EditorIconName;
  keywords: string;
};

export const BLOCK_TYPES: ReadonlyArray<BlockType> = [
  {
    kind: "paragraph",
    label: "Text",
    icon: "text-1",
    keywords: "paragraph plain",
  },
  { kind: "h1", label: "Heading 1", icon: "h1", keywords: "title h1" },
  { kind: "h2", label: "Heading 2", icon: "h2", keywords: "subtitle h2" },
  { kind: "h3", label: "Heading 3", icon: "h3", keywords: "h3" },
  {
    kind: "bullet",
    label: "Bulleted list",
    icon: "list-bullets",
    keywords: "unordered ul",
  },
  {
    kind: "number",
    label: "Numbered list",
    icon: "numbered-list",
    keywords: "ordered ol",
  },
  {
    kind: "check",
    label: "To-do list",
    icon: "checklist",
    keywords: "task checkbox",
  },
  {
    kind: "quote",
    label: "Quote",
    icon: "open-quote-1",
    keywords: "blockquote",
  },
  { kind: "code", label: "Code block", icon: "code", keywords: "fence pre" },
];

export const $getBlockKind = (): BlockKind | null => {
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) return null;
  const node = selection.anchor.getNode();
  const list = $getNearestNodeOfType(node, ListNode);
  if (list !== null) return list.getListType();
  const block = node.getTopLevelElement();
  if ($isHeadingNode(block)) {
    const tag = block.getTag();
    return tag === "h1" || tag === "h2" || tag === "h3" ? tag : null;
  }
  if ($isQuoteNode(block)) return "quote";
  if ($isCodeNode(block)) return "code";
  return block === null || block.getType() === "paragraph" ? "paragraph" : null;
};

export const $setBlockKind = (kind: BlockKind) => {
  if (kind === "bullet" || kind === "number" || kind === "check") {
    $insertList(kind);
    const selection = $getSelection();
    if (kind !== "check" || !$isRangeSelection(selection)) return;
    for (const node of selection.getNodes()) {
      const item = $getNearestNodeOfType(node, ListItemNode);
      if (
        item !== null &&
        $getListItemChecked(item) === undefined &&
        !$isListNode(item.getFirstChild())
      )
        item.setChecked(false);
    }
    return;
  }
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) return;
  if ($getNearestNodeOfType(selection.anchor.getNode(), ListItemNode) !== null)
    $removeList();
  const current = $getSelection();
  if (!$isRangeSelection(current)) return;
  const blocks = new Map<string, ElementNode>();
  for (const node of current.getNodes()) {
    const block = node.getTopLevelElement();
    if ($isElementNode(block) && !$isListNode(block))
      blocks.set(block.getKey(), block);
  }
  for (const block of blocks.values()) {
    const next =
      kind === "paragraph"
        ? $createParagraphNode()
        : kind === "quote"
          ? $createQuoteNode()
          : kind === "code"
            ? $createCodeNode()
            : $createHeadingNode(kind);
    const children = block.getChildren();
    if (kind === "code")
      for (const child of children) if ($isTextNode(child)) child.setFormat(0);
    next.append(...children);
    block.replace(next);
  }
};

const $insertBlock = (node: LexicalNode) => {
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) return;
  const block = selection.anchor.getNode().getTopLevelElement();
  if (block === null) return;
  if ($isElementNode(block) && block.isEmpty()) block.replace(node);
  else block.insertAfter(node);
  if (node.getNextSibling() === null) node.insertAfter($createParagraphNode());
};

export const $insertDivider = () => {
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) return;
  const block = selection.anchor.getNode().getTopLevelElement();
  if (block === null) return;
  const rule = $createHorizontalRuleNode();
  const paragraph = $createParagraphNode();
  if ($isElementNode(block) && block.isEmpty()) block.replace(rule);
  else block.insertAfter(rule);
  rule.insertAfter(paragraph);
  paragraph.select();
};

export const $insertTable = () => {
  const table = $createTableNodeWithDimensions(3, 2, {
    rows: true,
    columns: false,
  });
  $setTableAlign(table, [null, null]);
  $insertBlock(table);
  const row = table.getFirstChild();
  const cell = $isTableRowNode(row) ? row.getFirstChild() : null;
  if ($isElementNode(cell)) cell.selectStart();
};

export type InsertOption = {
  key: string;
  label: string;
  icon: EditorIconName;
  keywords: string;
  apply: () => void;
};

export const INSERT_OPTIONS: ReadonlyArray<InsertOption> = [
  ...BLOCK_TYPES.map((block) => ({
    key: block.label,
    label: block.label,
    icon: block.icon,
    keywords: block.keywords,
    apply: () => $setBlockKind(block.kind),
  })),
  {
    key: "Divider",
    label: "Divider",
    icon: "divider",
    keywords: "rule hr separator",
    apply: $insertDivider,
  },
  {
    key: "Table",
    label: "Table",
    icon: "table",
    keywords: "grid rows columns",
    apply: $insertTable,
  },
];

export const filterInsertOptions = <
  T extends Pick<InsertOption, "label" | "keywords">,
>(
  options: ReadonlyArray<T>,
  query: string | null,
): T[] => {
  const needle = (query ?? "").trim().toLowerCase();
  if (needle.length === 0) return [...options];
  return options.filter(
    (option) =>
      option.label.toLowerCase().includes(needle) ||
      option.keywords.split(" ").some((keyword) => keyword.startsWith(needle)),
  );
};

export const $getSelectedTableCell = (): TableCellNode | null => {
  const selection = $getSelection();
  if (!$isRangeSelection(selection) && !$isTableSelection(selection))
    return null;
  return $getTableCellNodeFromLexicalNode(selection.anchor.getNode());
};

export const $spliceColumnAlign = (
  table: TableNode,
  start: number,
  deleteCount: number,
  ...insert: TableAlign[]
) => {
  const current = $getState(table, tableAlignState);
  const align = Array.from(
    { length: Math.max(current.length, table.getColumnCount()) },
    (_, column) => current[column] ?? null,
  );
  align.splice(start, deleteCount, ...insert);
  $setTableAlign(table, align.slice(0, table.getColumnCount()));
};

export const $normalizeTable = (table: TableNode) => {
  $setTableAlign(table, $getState(table, tableAlignState));
  table.getChildren().forEach((row, index) => {
    if (!$isTableRowNode(row)) return;
    for (const cell of row.getChildren())
      if ($isTableCellNode(cell))
        cell.setHeaderStyles(
          index === 0
            ? TableCellHeaderStates.ROW
            : TableCellHeaderStates.NO_STATUS,
        );
  });
};

export const $removeTable = (table: TableNode) => {
  const previous = table.getPreviousSibling();
  const next = table.getNextSibling();
  table.remove();
  if ($isElementNode(previous)) previous.selectEnd();
  else if ($isElementNode(next)) next.selectStart();
  else if ($getRoot().isEmpty())
    $getRoot().append($createParagraphNode()).selectEnd();
};

export const $getCellTable = (cell: TableCellNode) => {
  const table = cell.getParent()?.getParent();
  return $isTableNode(table) ? table : null;
};
