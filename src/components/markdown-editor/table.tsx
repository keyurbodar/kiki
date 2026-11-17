import { copyToClipboard } from "@lexical/clipboard";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $computeTableCellRectBoundary,
  $computeTableMap,
  $deleteTableColumnAtSelection,
  $deleteTableRowAtSelection,
  $getTableCellNodeFromLexicalNode,
  $getTableColumnIndexFromTableCellNode,
  $getTableRowIndexFromTableCellNode,
  $insertTableColumnAtSelection,
  $insertTableRowAtSelection,
  $isTableCellNode,
  $isTableNode,
  $isTableRowNode,
  $isTableSelection,
  type TableCellNode,
  TableCellNode as TableCellNodeClass,
  type TableNode,
} from "@lexical/table";
import {
  $createParagraphNode,
  $getSelection,
  $getState,
  $isDecoratorNode,
  $isElementNode,
  $isParagraphNode,
  $isRangeSelection,
  BLUR_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  COMMAND_PRIORITY_HIGH,
  CUT_COMMAND,
  INSERT_PARAGRAPH_COMMAND,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
  type LexicalNode,
  mergeRegister,
} from "lexical";
import { type RefObject, useEffect, useRef, useState } from "react";
import { Button } from "@/primitives/button";
import { Icon, type IconId } from "@/primitives/icon";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuSub,
  MenuSubTrigger,
  MenuTrigger,
} from "@/primitives/menu";
import {
  $getCellTable,
  $getSelectedTableCell,
  $normalizeTable,
  $removeTable,
  $spliceColumnAlign,
} from "./blocks";
import { type TableAlign, tableAlignState } from "./nodes";
import {
  cn,
  menuCheckClass,
  menuIconSlotClass,
  menuValueClass,
  preventMouseDown,
  readLengthToken,
  refocusEditor,
} from "./shared";
import { MarkdownEditorTableMenu } from "./slots";

type TableAction = {
  label: string;
  icon: IconId;
  intent?: "danger";
  $run: (table: TableNode, cell: TableCellNode) => void;
};

export const COLUMN_ALIGNMENTS: ReadonlyArray<{
  value: TableAlign;
  label: string;
  icon: IconId;
}> = [
  { value: null, label: "Default", icon: "alignment-left" },
  { value: "left", label: "Left", icon: "alignment-left" },
  { value: "center", label: "Center", icon: "alignment-center" },
  { value: "right", label: "Right", icon: "alignment-right" },
];

const INSERT_ACTIONS: ReadonlyArray<TableAction> = [
  {
    label: "Insert row above",
    icon: "arrow-up",
    $run: (table) => {
      $insertTableRowAtSelection(false);
      $normalizeTable(table);
    },
  },
  {
    label: "Insert row below",
    icon: "arrow-down",
    $run: (table) => {
      $insertTableRowAtSelection(true);
      $normalizeTable(table);
    },
  },
  {
    label: "Insert column left",
    icon: "arrow-left",
    $run: (table, cell) => {
      const column = $getTableColumnIndexFromTableCellNode(cell);
      $insertTableColumnAtSelection(false);
      $spliceColumnAlign(table, column, 0, null);
      $normalizeTable(table);
    },
  },
  {
    label: "Insert column right",
    icon: "arrow-right",
    $run: (table, cell) => {
      const column = $getTableColumnIndexFromTableCellNode(cell);
      $insertTableColumnAtSelection(true);
      $spliceColumnAlign(table, column + 1, 0, null);
      $normalizeTable(table);
    },
  },
];

const DELETE_ACTIONS: ReadonlyArray<TableAction> = [
  {
    label: "Delete row",
    icon: "trash-can",
    $run: (table) => {
      if (table.getChildrenSize() <= 1) {
        $removeTable(table);
        return;
      }
      $deleteTableRowAtSelection();
      $normalizeTable(table);
    },
  },
  {
    label: "Delete column",
    icon: "trash-can",
    $run: (table, cell) => {
      if (table.getColumnCount() <= 1) {
        $removeTable(table);
        return;
      }
      const column = $getTableColumnIndexFromTableCellNode(cell);
      $deleteTableColumnAtSelection();
      $spliceColumnAlign(table, column, 1);
    },
  },
  {
    label: "Delete table",
    icon: "trash-can",
    intent: "danger",
    $run: $removeTable,
  },
];

type LineSelection = {
  table: TableNode;
  rect: {
    minColumn: number;
    maxColumn: number;
    minRow: number;
    maxRow: number;
  };
  anchor: { startRow: number; startColumn: number };
  wholeRows: boolean;
  wholeColumns: boolean;
};

const $getLineSelection = (): LineSelection | null => {
  const selection = $getSelection();
  if (!$isTableSelection(selection)) return null;
  const anchor = $getTableCellNodeFromLexicalNode(selection.anchor.getNode());
  const focus = $getTableCellNodeFromLexicalNode(selection.focus.getNode());
  const table = anchor === null ? null : $getCellTable(anchor);
  if (anchor === null || focus === null || table === null) return null;
  const [map, anchorCell, focusCell] = $computeTableMap(table, anchor, focus);
  const rect = $computeTableCellRectBoundary(map, anchorCell, focusCell);
  const wholeRows =
    rect.minColumn === 0 && rect.maxColumn === (map[0]?.length ?? 0) - 1;
  const wholeColumns = rect.minRow === 0 && rect.maxRow === map.length - 1;
  if (!wholeRows && !wholeColumns) return null;
  return { table, rect, anchor: anchorCell, wholeRows, wholeColumns };
};

const $deleteLines = ({
  table,
  rect,
  anchor,
  wholeRows,
  wholeColumns,
}: LineSelection) => {
  if (wholeRows && wholeColumns) {
    $removeTable(table);
    return;
  }
  const rows = table.getChildren().filter($isTableRowNode);
  if (wholeRows) {
    for (const row of rows.slice(rect.minRow, rect.maxRow + 1)) row.remove();
  } else {
    for (const row of rows)
      for (const cell of row
        .getChildren()
        .slice(rect.minColumn, rect.maxColumn + 1))
        cell.remove();
    $spliceColumnAlign(
      table,
      rect.minColumn,
      rect.maxColumn - rect.minColumn + 1,
    );
  }
  $normalizeTable(table);
  const row = table.getChildAtIndex(
    Math.min(
      wholeRows ? rect.minRow : anchor.startRow,
      table.getChildrenSize() - 1,
    ),
  );
  const cell = $isTableRowNode(row)
    ? row.getChildAtIndex(
        Math.min(
          wholeRows ? anchor.startColumn : rect.minColumn,
          row.getChildrenSize() - 1,
        ),
      )
    : null;
  if ($isTableCellNode(cell)) cell.selectStart();
};

const $deleteSelectedLines = (event: KeyboardEvent) => {
  const lines = $getLineSelection();
  if (lines === null) return false;
  event.preventDefault();
  $deleteLines(lines);
  return true;
};

const $moveToNextRow = () => {
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) return false;
  const cell = $getTableCellNodeFromLexicalNode(selection.anchor.getNode());
  if (cell === null) return false;
  const table = $getCellTable(cell);
  if (table === null) return false;
  const column = $getTableColumnIndexFromTableCellNode(cell);
  const next = table.getChildAtIndex(
    $getTableRowIndexFromTableCellNode(cell) + 1,
  );
  let target: LexicalNode | null = null;
  if ($isTableRowNode(next)) target = next.getChildAtIndex(column);
  else {
    const inserted = $insertTableRowAtSelection(true);
    $normalizeTable(table);
    target = inserted?.getChildAtIndex(column) ?? null;
  }
  if ($isTableCellNode(target)) target.selectEnd();
  return true;
};

const flattenBlocks = (node: LexicalNode): LexicalNode[] => {
  if ($isElementNode(node) && !node.isInline())
    return node.getChildren().flatMap(flattenBlocks);
  if ($isDecoratorNode(node) && !node.isInline()) return [];
  return [node];
};

const $keepCellParagraphs = (cell: TableCellNode) => {
  for (const child of cell.getChildren()) {
    if ($isParagraphNode(child)) continue;
    const paragraph = $createParagraphNode();
    paragraph.append(...flattenBlocks(child));
    child.replace(paragraph);
  }
};

export function TableBehaviorPlugin() {
  const [editor] = useLexicalComposerContext();
  useEffect(
    () =>
      mergeRegister(
        editor.registerCommand(
          INSERT_PARAGRAPH_COMMAND,
          $moveToNextRow,
          COMMAND_PRIORITY_CRITICAL,
        ),
        editor.registerCommand(
          KEY_BACKSPACE_COMMAND,
          $deleteSelectedLines,
          COMMAND_PRIORITY_CRITICAL,
        ),
        editor.registerCommand(
          KEY_DELETE_COMMAND,
          $deleteSelectedLines,
          COMMAND_PRIORITY_CRITICAL,
        ),
        editor.registerCommand(
          CUT_COMMAND,
          (event) => {
            if ($getLineSelection() === null) return false;
            event?.preventDefault();
            copyToClipboard(
              editor,
              event instanceof ClipboardEvent ? event : null,
            ).then((copied) => {
              if (!copied) return;
              editor.update(() => {
                const lines = $getLineSelection();
                if (lines !== null) $deleteLines(lines);
              });
            });
            return true;
          },
          COMMAND_PRIORITY_CRITICAL,
        ),
        editor.registerNodeTransform(TableCellNodeClass, $keepCellParagraphs),
      ),
    [editor],
  );
  return null;
}

type MenuState = {
  lift: number;
  top: number;
  right: number;
  column: number;
  align: TableAlign;
};

const $readTableCell = () => {
  const cell = $getSelectedTableCell();
  if (cell === null) return null;
  const table = cell.getParent()?.getParent();
  if (!$isTableNode(table)) return null;
  const column = $getTableColumnIndexFromTableCellNode(cell);
  return {
    cellKey: cell.getKey(),
    tableKey: table.getKey(),
    column,
    align: $getState(table, tableAlignState)[column] ?? null,
  };
};

export function TableActionMenuPlugin({
  containerRef,
}: {
  containerRef: RefObject<HTMLDivElement | null>;
}) {
  const [editor] = useLexicalComposerContext();
  const [state, setState] = useState<MenuState | null>(null);
  const [open, setOpen] = useState(false);
  const holding = useRef(false);

  useEffect(() => {
    let marked: HTMLElement | null = null;
    const mark = (element: HTMLElement | null) => {
      if (marked === element) return;
      marked?.removeAttribute("data-editing");
      element?.setAttribute("data-editing", "");
      marked = element;
    };
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        const container = containerRef.current;
        const current = editorState.read($readTableCell);
        const tableElement =
          current === null ? null : editor.getElementByKey(current.tableKey);
        mark(current === null ? null : editor.getElementByKey(current.cellKey));
        if (current === null || tableElement === null || container === null) {
          setState(null);
          return;
        }
        const tableRect = tableElement.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        setState({
          lift: readLengthToken(container, "--markdown-editor-table-menu-lift"),
          top: tableRect.top - containerRect.top,
          right: containerRect.right - tableRect.right,
          column: current.column,
          align: current.align,
        });
      }),
      editor.registerCommand(
        BLUR_COMMAND,
        () => {
          if (!holding.current) {
            mark(null);
            setState(null);
          }
          return false;
        },
        COMMAND_PRIORITY_HIGH,
      ),
      () => mark(null),
    );
  }, [editor, containerRef]);

  if (state === null) return null;

  const run = (action: (table: TableNode, cell: TableCellNode) => void) => {
    editor.update(() => {
      const cell = $getSelectedTableCell();
      const table = cell?.getParent()?.getParent();
      if (cell != null && $isTableNode(table)) action(table, cell);
    });
  };
  const alignment = COLUMN_ALIGNMENTS.find(
    (option) => option.value === state.align,
  );

  return (
    <MarkdownEditorTableMenu
      className="absolute"
      style={{ top: state.top - state.lift, right: state.right }}
    >
      <Menu
        open={open}
        onOpenChange={(next) => {
          holding.current = next;
          setOpen(next);
          if (!next) refocusEditor(editor);
        }}
      >
        <MenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label="Table actions"
              onMouseDown={preventMouseDown}
            >
              <Icon name="dot-grid-1x3-horizontal" />
            </Button>
          }
        />
        <MenuContent align="end" side="bottom" className="w-52">
          {INSERT_ACTIONS.map((action) => (
            <MenuItem key={action.label} onClick={() => run(action.$run)}>
              <span className={menuIconSlotClass}>
                <Icon name={action.icon} />
              </span>
              {action.label}
            </MenuItem>
          ))}
          <MenuSeparator />
          <MenuSub>
            <MenuSubTrigger>
              <span className={menuIconSlotClass}>
                {alignment === undefined ? null : (
                  <Icon name={alignment.icon} />
                )}
              </span>
              Align column
              <span className={menuValueClass}>{alignment?.label}</span>
            </MenuSubTrigger>
            <MenuContent className="w-36">
              {COLUMN_ALIGNMENTS.map((option) => (
                <MenuItem
                  key={option.label}
                  onClick={() =>
                    run((table) =>
                      $spliceColumnAlign(table, state.column, 1, option.value),
                    )
                  }
                >
                  <span className={menuIconSlotClass}>
                    <Icon name={option.icon} />
                  </span>
                  {option.label}
                  {option.value === state.align ? (
                    <Icon
                      name="checkmark-1"
                      className={cn(menuCheckClass, "ml-auto")}
                    />
                  ) : null}
                </MenuItem>
              ))}
            </MenuContent>
          </MenuSub>
          <MenuSeparator />
          {DELETE_ACTIONS.map((action) => (
            <MenuItem
              key={action.label}
              intent={action.intent}
              onClick={() => run(action.$run)}
            >
              <span className={menuIconSlotClass}>
                <Icon name={action.icon} />
              </span>
              {action.label}
            </MenuItem>
          ))}
        </MenuContent>
      </Menu>
    </MarkdownEditorTableMenu>
  );
}
