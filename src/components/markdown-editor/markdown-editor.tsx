import "./markdown-editor.css";
import {
  $createHorizontalRuleNode,
  $isHorizontalRuleNode,
  HorizontalRuleNode,
} from "@lexical/extension";
import { $isLinkNode } from "@lexical/link";
import { $isListItemNode } from "@lexical/list";
import {
  CHECK_LIST,
  CODE,
  type ElementTransformer,
  HEADING,
  LINK,
  ORDERED_LIST,
  QUOTE,
  TEXT_FORMAT_TRANSFORMERS,
  type Transformer,
  UNORDERED_LIST,
} from "@lexical/markdown";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { CheckListPlugin } from "@lexical/react/LexicalCheckListPlugin";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { TabIndentationPlugin } from "@lexical/react/LexicalTabIndentationPlugin";
import { TablePlugin } from "@lexical/react/LexicalTablePlugin";
import {
  $addUpdateTag,
  $createParagraphNode,
  $getNearestNodeFromDOMNode,
  $getRoot,
  CLICK_COMMAND,
  COMMAND_PRIORITY_HIGH,
  type EditorThemeClasses,
  FORMAT_TEXT_COMMAND,
  HISTORY_PUSH_TAG,
  KEY_DOWN_COMMAND,
  mergeRegister,
} from "lexical";
import {
  type ComponentProps,
  type ReactNode,
  type Ref,
  useEffect,
  useEffectEvent,
  useImperativeHandle,
  useRef,
} from "react";
import { CodeLanguagePlugin } from "./code-language";
import { registerEditState } from "./edit-state";
import { $exportMarkdown, $importMarkdown } from "./markdown";
import { MARKDOWN_EDITOR_NODES } from "./nodes";
import { CheckListShortcutPlugin, SlashPlaceholderPlugin } from "./plugins";
import { PreviewBlocksPlugin } from "./preview-blocks";
import { SelectionToolbarPlugin } from "./selection-toolbar";
import { cn } from "./shared";
import { SlashMenuPlugin } from "./slash-menu";
import { TableActionMenuPlugin, TableBehaviorPlugin } from "./table";

export {
  MarkdownEditorCodeLanguage,
  type MarkdownEditorCodeLanguageProps,
  MarkdownEditorTableMenu,
  type MarkdownEditorTableMenuProps,
  MarkdownEditorToolbar,
  type MarkdownEditorToolbarProps,
} from "./slots";

const HORIZONTAL_RULE: ElementTransformer = {
  dependencies: [HorizontalRuleNode],
  export: (node) => ($isHorizontalRuleNode(node) ? "---" : null),
  regExp: /^(---|\*\*\*|___)\s?$/,
  replace: (parent, _children, _match, isImport) => {
    $addUpdateTag(HISTORY_PUSH_TAG);
    const rule = $createHorizontalRuleNode();
    if (isImport || parent.getNextSibling() !== null) parent.replace(rule);
    else parent.insertBefore(rule);
    rule.selectNext();
  },
  type: "element",
};

const CODE_BLOCK: Transformer = {
  ...CODE,
  replace: (...args: Parameters<typeof CODE.replace>) => {
    const result = CODE.replace(...args);
    if (result !== false) $addUpdateTag(HISTORY_PUSH_TAG);
    return result;
  },
} as Transformer;

const SHORTCUTS: Transformer[] = [
  HEADING,
  QUOTE,
  CODE_BLOCK,
  UNORDERED_LIST,
  ORDERED_LIST,
  CHECK_LIST,
  HORIZONTAL_RULE,
  LINK,
  ...TEXT_FORMAT_TRANSFORMERS,
];

const THEME: EditorThemeClasses = {
  text: { italic: "italic", strikethrough: "line-through" },
  list: {
    nested: { listitem: "md-editor-nested" },
    listitemChecked: "md-editor-check",
    listitemUnchecked: "md-editor-check",
  },
  code: "md-editor-code",
  hrSelected: "outline-1 outline-solid outline-ring outline-offset-1",
  table: "md-editor-table",
  tableScrollableWrapper: "md-editor-table-scroll",
  tableCell: "md-editor-cell",
  tableCellHeader: "md-editor-cell-header",
  tableCellSelected: "md-editor-cell-selected",
  tableSelection: "select-none",
};

const INSETS = {
  page: "mx-auto max-w-3xl px-6 py-4 md:py-6",
  field: "px-2.5 py-1.5 text-sm",
};

export type MarkdownEditorHandle = {
  getText: () => string;
  focus: () => void;
};

export type MarkdownEditorProps = Omit<
  ComponentProps<"div">,
  "onChange" | "placeholder" | "ref" | "children"
> & {
  initialText?: string;
  stateKey?: string;
  onChange?: () => void;
  onOpenFile?: (path: string) => void;
  contentClassName?: string;
  inset?: keyof typeof INSETS;
  placeholder?: ReactNode;
  autoFocus?: boolean;
  ref?: Ref<MarkdownEditorHandle>;
};

const throwError = (error: Error) => {
  throw error;
};

export function MarkdownEditor({
  initialText = "",
  ...props
}: MarkdownEditorProps) {
  return (
    <LexicalComposer
      initialConfig={{
        namespace: "capy-markdown-editor",
        theme: THEME,
        nodes: [...MARKDOWN_EDITOR_NODES],
        editorState: () => {
          const root = $getRoot();
          $importMarkdown(root, initialText);
          if (root.isEmpty()) root.append($createParagraphNode());
        },
        onError: throwError,
      }}
    >
      <MarkdownEditorSurface {...props} />
    </LexicalComposer>
  );
}

const URL_SCHEME = /^[a-z][a-z\d+.-]*:/i;

export const linkTarget = (
  href: string,
): { kind: "web" | "file" | "other"; href: string } =>
  /^https?:\/\//.test(href)
    ? { kind: "web", href }
    : URL_SCHEME.test(href) || href.startsWith("#")
      ? { kind: "other", href }
      : { kind: "file", href };

const preventDecorationMouseDown = (event: MouseEvent) => {
  if (
    event.button === 0 &&
    event.target instanceof Element &&
    event.target.closest("[data-check-box], a[data-chip]") !== null
  )
    event.preventDefault();
};

function MarkdownEditorSurface({
  stateKey,
  onChange,
  onOpenFile,
  className,
  contentClassName,
  inset = "page",
  placeholder,
  autoFocus,
  ref,
  ...props
}: Omit<MarkdownEditorProps, "initialText">) {
  const [editor] = useLexicalComposerContext();
  const containerRef = useRef<HTMLDivElement>(null);
  const insetClass = INSETS[inset];
  const notifyChange = useEffectEvent(() => onChange?.());

  useEffect(() => {
    let stale = true;
    const onSelectionChange = () => {
      const selection = document.getSelection();
      const root = editor.getRootElement();
      if (
        !stale ||
        selection === null ||
        selection.isCollapsed ||
        root === null
      )
        return;
      if (!root.contains(selection.anchorNode)) return;
      stale = false;
      editor.read(() => {
        const { spans } = $exportMarkdown($getRoot());
        $getRoot()
          .getChildren()
          .forEach((child, index) => {
            const span = spans[index];
            if (span !== undefined)
              editor
                .getElementByKey(child.getKey())
                ?.setAttribute("data-md-new", span.join("-"));
          });
      });
    };
    document.addEventListener("selectionchange", onSelectionChange);
    return mergeRegister(
      editor.registerUpdateListener(({ dirtyElements, dirtyLeaves }) => {
        if (dirtyElements.size > 0 || dirtyLeaves.size > 0) stale = true;
      }),
      () => document.removeEventListener("selectionchange", onSelectionChange),
    );
  }, [editor]);

  const openLink = useEffectEvent((href: string) => {
    const target = linkTarget(href);
    if (target.kind === "web")
      window.open(target.href, "_blank", "noopener,noreferrer");
    else if (target.kind === "file") onOpenFile?.(target.href);
  });

  useEffect(
    () =>
      mergeRegister(
        editor.registerCommand(
          CLICK_COMMAND,
          (event) => {
            if (!(event.target instanceof Element)) return false;
            const box = event.target.closest("[data-check-box]");
            if (box !== null) {
              event.preventDefault();
              const item = $getNearestNodeFromDOMNode(box);
              if ($isListItemNode(item)) item.toggleChecked();
              return true;
            }
            const anchor = event.target.closest("a[href]");
            if (
              !(anchor instanceof HTMLAnchorElement) ||
              (!(event.metaKey || event.ctrlKey) &&
                !anchor.hasAttribute("data-chip"))
            )
              return false;
            event.preventDefault();
            const node = $getNearestNodeFromDOMNode(anchor);
            openLink(
              $isLinkNode(node)
                ? node.getURL()
                : (anchor.getAttribute("href") ?? ""),
            );
            return true;
          },
          COMMAND_PRIORITY_HIGH,
        ),
        editor.registerRootListener((root, previous) => {
          previous?.removeEventListener(
            "mousedown",
            preventDecorationMouseDown,
          );
          root?.addEventListener("mousedown", preventDecorationMouseDown);
        }),
        editor.registerCommand(
          KEY_DOWN_COMMAND,
          (event) => {
            if (!(event.metaKey || event.ctrlKey) || event.altKey) return false;
            const key = event.key.toLowerCase();
            const format =
              key === "e" && !event.shiftKey
                ? "code"
                : key === "s" && event.shiftKey
                  ? "strikethrough"
                  : null;
            if (format === null) {
              if (key !== "u" || event.shiftKey) return false;
              event.preventDefault();
              return true;
            }
            event.preventDefault();
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
            return true;
          },
          COMMAND_PRIORITY_HIGH,
        ),
      ),
    [editor],
  );

  useEffect(() => {
    if (stateKey === undefined) return;
    return registerEditState(stateKey, () =>
      editor.read(() => $exportMarkdown($getRoot()).text),
    );
  }, [editor, stateKey]);

  useImperativeHandle(
    ref,
    () => ({
      getText: () => editor.read(() => $exportMarkdown($getRoot()).text),
      focus: () => editor.focus(),
    }),
    [editor],
  );

  return (
    <div ref={containerRef} className={cn("relative", className)} {...props}>
      <RichTextPlugin
        contentEditable={
          <div className={cn("w-full", insetClass, contentClassName)}>
            <ContentEditable
              aria-label="Document"
              data-component="markdown"
              data-markdown-editor=""
              data-file-editor=""
              className="flex-1 whitespace-pre-wrap outline-none"
            />
          </div>
        }
        placeholder={
          placeholder === undefined ? null : (
            <div
              className={cn(
                "pointer-events-none absolute inset-x-0 top-0 w-full text-muted-foreground-3",
                insetClass,
                contentClassName,
              )}
            >
              {placeholder}
            </div>
          )
        }
        ErrorBoundary={LexicalErrorBoundary}
      />
      <HistoryPlugin />
      <ListPlugin />
      <CheckListPlugin />
      <LinkPlugin />
      <TabIndentationPlugin />
      <TablePlugin
        hasCellMerge={false}
        hasCellBackgroundColor={false}
        hasHorizontalScroll
      />
      <TableBehaviorPlugin />
      <MarkdownShortcutPlugin transformers={SHORTCUTS} />
      <CheckListShortcutPlugin />
      {autoFocus === true ? <AutoFocusPlugin /> : null}
      <SlashMenuPlugin />
      <SlashPlaceholderPlugin />
      <SelectionToolbarPlugin containerRef={containerRef} />
      <TableActionMenuPlugin containerRef={containerRef} />
      <CodeLanguagePlugin containerRef={containerRef} />
      <PreviewBlocksPlugin />
      <OnChangePlugin ignoreSelectionChange onChange={() => notifyChange()} />
    </div>
  );
}
