import { $isLinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  BLUR_COMMAND,
  COMMAND_PRIORITY_HIGH,
  FORMAT_TEXT_COMMAND,
  KEY_DOWN_COMMAND,
  type LexicalEditor,
} from "lexical";
import {
  type RefObject,
  useContext,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { Button } from "@/primitives/button";
import { Input } from "@/primitives/input";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/primitives/menu";
import {
  $getBlockKind,
  $getSelectedTableCell,
  $setBlockKind,
  BLOCK_TYPES,
  type BlockKind,
} from "./blocks";
import { EditorIcon } from "./icons";
import { MarkdownEditorSelectionActionsContext } from "./selection-actions";
import {
  cn,
  menuCheckClass,
  menuIconSlotClass,
  overlayLayerClass,
  overlaySurfaceClass,
  preventMouseDown,
  readLengthToken,
  refocusEditor,
} from "./shared";
import { MarkdownEditorToolbar } from "./slots";
import { ToolbarAction } from "./toolbar-action";

const INLINE_FORMATS = ["bold", "italic", "strikethrough", "code"] as const;

type InlineFormat = (typeof INLINE_FORMATS)[number];

type Placement = {
  top: number;
  left: number;
  below: boolean;
  bottom?: number;
};

export type ToolbarMetrics = { halfWidth: number; clearance: number };

export type ToolbarState = Placement & {
  offset: number;
  formats: InlineFormat[];
  link: boolean;
  block: BlockKind | null;
  inTable: boolean;
};

const scrollContainerTop = (element: HTMLElement) => {
  let parent = element.parentElement;
  while (parent !== null) {
    const overflow = getComputedStyle(parent).overflowY;
    if (overflow === "auto" || overflow === "scroll")
      return Math.max(parent.getBoundingClientRect().top, 0);
    parent = parent.parentElement;
  }
  return 0;
};

export const placeToolbar = (
  selection: DOMRect,
  container: DOMRect,
  scrollTop: number,
  { halfWidth, clearance }: ToolbarMetrics,
): Placement => ({
  top: selection.top - container.top,
  left: Math.max(
    halfWidth,
    Math.min(
      selection.left - container.left + selection.width / 2,
      container.width - halfWidth,
    ),
  ),
  below: selection.top - scrollTop < clearance,
  bottom: selection.bottom - container.top,
});

const $readToolbar = (
  editor: LexicalEditor,
  container: HTMLElement,
  previous: ToolbarState | null,
): ToolbarState | null => {
  const selection = $getSelection();
  if (!$isRangeSelection(selection) || selection.isCollapsed()) return null;
  const domSelection = window.getSelection();
  const range =
    domSelection !== null && domSelection.rangeCount > 0
      ? domSelection.getRangeAt(0)
      : null;
  const root = editor.getRootElement();
  const rect =
    range !== null && root?.contains(range.commonAncestorContainer) === true
      ? range.getBoundingClientRect()
      : null;
  const placement =
    rect === null || (rect.width === 0 && rect.height === 0)
      ? previous
      : placeToolbar(
          rect,
          container.getBoundingClientRect(),
          scrollContainerTop(container),
          {
            halfWidth: readLengthToken(
              container,
              "--markdown-editor-toolbar-half-width",
            ),
            clearance: readLengthToken(
              container,
              "--markdown-editor-toolbar-clearance",
            ),
          },
        );
  if (placement === null) return null;
  return {
    offset: readLengthToken(container, "--markdown-editor-toolbar-offset"),
    top: placement.top,
    left: placement.left,
    below: placement.below,
    bottom: placement.bottom,
    formats: INLINE_FORMATS.filter((format) => selection.hasFormat(format)),
    link: selection
      .getNodes()
      .some((node) => $isLinkNode(node) || $isLinkNode(node.getParent())),
    block: $getBlockKind(),
    inTable: $getSelectedTableCell() !== null,
  };
};

export function SelectionToolbarPlugin({
  containerRef,
}: {
  containerRef: RefObject<HTMLDivElement | null>;
}) {
  const [editor] = useLexicalComposerContext();
  const actions = useContext(MarkdownEditorSelectionActionsContext);
  const [state, setState] = useState<ToolbarState | null>(null);
  const [linkDraft, setLinkDraft] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const holding = useRef(false);
  const latest = useRef<ToolbarState | null>(null);

  useEffect(() => {
    latest.current = state;
  }, [state]);

  useEffect(
    () =>
      editor.registerUpdateListener(({ editorState }) => {
        const container = containerRef.current;
        if (container === null) return;
        const next = editorState.read(() =>
          $readToolbar(editor, container, latest.current),
        );
        if (next === null) {
          if (holding.current) return;
          setLinkDraft(null);
        }
        setState(next);
      }),
    [editor, containerRef],
  );

  useEffect(
    () =>
      editor.registerCommand(
        BLUR_COMMAND,
        () => {
          if (!holding.current) {
            setState(null);
            setLinkDraft(null);
          }
          return false;
        },
        COMMAND_PRIORITY_HIGH,
      ),
    [editor],
  );

  const toggleLink = () => {
    const current = latest.current;
    if (current === null) return;
    if (current.link) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
      return;
    }
    holding.current = true;
    setLinkDraft("");
  };
  const onLinkShortcut = useEffectEvent(toggleLink);

  useEffect(
    () =>
      editor.registerCommand(
        KEY_DOWN_COMMAND,
        (event) => {
          if (
            !(event.metaKey || event.ctrlKey) ||
            event.key.toLowerCase() !== "k"
          )
            return false;
          event.preventDefault();
          onLinkShortcut();
          return true;
        },
        COMMAND_PRIORITY_HIGH,
      ),
    [editor],
  );

  if (state === null) return null;

  const closeLink = () => {
    holding.current = false;
    setLinkDraft(null);
    editor.focus();
  };
  const dismissLink = () => {
    if (!holding.current) return;
    holding.current = false;
    setLinkDraft(null);
    setState(null);
  };
  const current = BLOCK_TYPES.find((block) => block.kind === state.block);

  return (
    <MarkdownEditorToolbar
      role="toolbar"
      aria-label="Formatting"
      className={cn(
        overlaySurfaceClass,
        overlayLayerClass,
        "absolute flex -translate-x-1/2 items-center gap-0.5",
        state.below ? "translate-y-0" : "-translate-y-full",
      )}
      style={{
        top: state.below
          ? (state.bottom ?? state.top) + state.offset
          : state.top - state.offset,
        left: state.left,
      }}
    >
      {linkDraft === null ? (
        <>
          {state.inTable ? null : (
            <Menu
              open={menuOpen}
              onOpenChange={(open) => {
                holding.current = open;
                setMenuOpen(open);
                if (!open) refocusEditor(editor);
              }}
            >
              <MenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="xs"
                    aria-label="Turn into"
                    onMouseDown={preventMouseDown}
                  >
                    {current?.label ?? "Turn into"}
                    <EditorIcon name="chevron-down-small" />
                  </Button>
                }
              />
              <MenuContent align="start" side="bottom">
                {BLOCK_TYPES.map((block) => (
                  <MenuItem
                    key={block.kind}
                    onClick={() =>
                      editor.update(() => $setBlockKind(block.kind))
                    }
                  >
                    <span className={menuIconSlotClass}>
                      <EditorIcon name={block.icon} />
                    </span>
                    {block.label}
                    {block.kind === state.block ? (
                      <EditorIcon
                        name="checkmark-1"
                        className={cn(menuCheckClass, "ml-auto")}
                      />
                    ) : null}
                  </MenuItem>
                ))}
              </MenuContent>
            </Menu>
          )}
          <ToolbarAction
            label="Bold"
            pressed={state.formats.includes("bold")}
            onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}
          >
            <EditorIcon name="bold" />
          </ToolbarAction>
          <ToolbarAction
            label="Italic"
            pressed={state.formats.includes("italic")}
            onClick={() =>
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")
            }
          >
            <EditorIcon name="italic" />
          </ToolbarAction>
          <ToolbarAction
            label="Strikethrough"
            pressed={state.formats.includes("strikethrough")}
            onClick={() =>
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough")
            }
          >
            <EditorIcon name="strike-through" />
          </ToolbarAction>
          <ToolbarAction
            label="Code"
            pressed={state.formats.includes("code")}
            onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "code")}
          >
            <EditorIcon name="code" />
          </ToolbarAction>
          <ToolbarAction label="Link" pressed={state.link} onClick={toggleLink}>
            <EditorIcon name="chain-link-1" />
          </ToolbarAction>
          {actions === null ? null : (
            <>
              <div
                role="none"
                className="mx-0.5 h-4 w-hairline shrink-0 bg-border-1"
              />
              <ToolbarAction label="Comment" onClick={actions.comment}>
                <EditorIcon name="bubble-wide" />
              </ToolbarAction>
              <ToolbarAction
                label="Copy"
                onClick={() => {
                  navigator.clipboard.writeText(actions.text).then(
                    () => toast.success("Copied"),
                    () => toast.error("Could not copy"),
                  );
                }}
              >
                <EditorIcon name="square-behind-square-2" />
              </ToolbarAction>
            </>
          )}
        </>
      ) : (
        <Input
          autoFocus
          size="sm"
          variant="blank"
          placeholder="Paste a link"
          aria-label="Link URL"
          value={linkDraft}
          className="w-64"
          onChange={(event) => setLinkDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              event.stopPropagation();
              closeLink();
              return;
            }
            if (event.key !== "Enter") return;
            event.preventDefault();
            const url = linkDraft.trim();
            if (url.length > 0)
              editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
            closeLink();
          }}
          onBlur={dismissLink}
        />
      )}
    </MarkdownEditorToolbar>
  );
}
