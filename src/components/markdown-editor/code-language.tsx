import { $isCodeNode } from "@lexical/code";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  BLUR_COMMAND,
  COMMAND_PRIORITY_HIGH,
  mergeRegister,
} from "lexical";
import { type RefObject, useEffect, useRef, useState } from "react";
import { Button } from "@/primitives/button";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuSearchRow,
  MenuTrigger,
} from "@/primitives/menu";
import { filterCodeLanguages, findCodeLanguage } from "./code-languages";
import { EditorIcon } from "./icons";
import {
  cn,
  menuCheckClass,
  menuSearchInputClass,
  preventMouseDown,
  readLengthToken,
  refocusEditor,
} from "./shared";
import { MarkdownEditorCodeLanguage } from "./slots";

type BadgeState = {
  top: number;
  left: number;
  inset: number;
  language: string;
};

const $readCodeBlock = () => {
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) return null;
  const block = selection.anchor.getNode().getTopLevelElement();
  return $isCodeNode(block)
    ? { key: block.getKey(), language: block.getLanguage() ?? "" }
    : null;
};

export const codeLanguageLabel = (language: string) =>
  language.length === 0
    ? "Plain text"
    : (findCodeLanguage(language)?.name ?? language);

export function CodeLanguagePlugin({
  containerRef,
}: {
  containerRef: RefObject<HTMLDivElement | null>;
}) {
  const [editor] = useLexicalComposerContext();
  const [state, setState] = useState<BadgeState | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
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
        const current = editorState.read($readCodeBlock);
        const element =
          current === null ? null : editor.getElementByKey(current.key);
        mark(element);
        if (current === null || element === null || container === null) {
          setState(null);
          return;
        }
        const rect = element.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        setState({
          inset: readLengthToken(container, "--markdown-editor-badge-inset"),
          top: rect.top - containerRect.top,
          left: rect.left - containerRect.left,
          language: current.language,
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

  const options = filterCodeLanguages(query);
  const selected = findCodeLanguage(state.language);
  const choose = (language: string | null) => {
    editor.update(() => {
      const block = $readCodeBlock();
      if (block === null) return;
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      const node = selection.anchor.getNode().getTopLevelElement();
      if ($isCodeNode(node)) node.setLanguage(language);
    });
    setOpen(false);
    holding.current = false;
    setQuery("");
    refocusEditor(editor);
  };

  return (
    <MarkdownEditorCodeLanguage
      className="absolute"
      style={{ top: state.top + state.inset, left: state.left + state.inset }}
    >
      <Menu
        open={open}
        onOpenChange={(next) => {
          holding.current = next;
          setOpen(next);
          if (!next) {
            setQuery("");
            refocusEditor(editor);
          }
        }}
      >
        <MenuTrigger
          render={
            <Button
              variant="ghost"
              size="xs"
              aria-label="Code language"
              onMouseDown={preventMouseDown}
            >
              {codeLanguageLabel(state.language)}
              <EditorIcon name="chevron-down-small" />
            </Button>
          }
        />
        <MenuContent
          align="start"
          side="bottom"
          className="max-h-(--available-height) w-56 overflow-y-auto"
        >
          <MenuSearchRow>
            <input
              // biome-ignore lint/a11y/noAutofocus: the language search takes focus when the menu opens, as in Capy
              autoFocus
              className={menuSearchInputClass}
              aria-label="Search languages"
              placeholder="Search languages"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (
                  event.key === "Escape" ||
                  event.key === "ArrowDown" ||
                  event.key === "ArrowUp"
                )
                  return;
                event.stopPropagation();
                if (event.key !== "Enter") return;
                event.preventDefault();
                const [first] = options;
                if (first !== undefined) choose(first?.id ?? null);
              }}
            />
          </MenuSearchRow>
          {options.length === 0 ? (
            <div className="px-2 py-3 text-center text-sm font-normal text-muted-foreground-2">
              No matches
            </div>
          ) : null}
          {options.map((option) => (
            <MenuItem
              key={option?.id ?? ""}
              onClick={() => choose(option?.id ?? null)}
            >
              {option?.name ?? "Plain text"}
              {(
                option === null
                  ? state.language.length === 0
                  : option === selected
              ) ? (
                <EditorIcon
                  name="checkmark-1"
                  className={cn(menuCheckClass, "ml-auto")}
                />
              ) : null}
            </MenuItem>
          ))}
        </MenuContent>
      </Menu>
    </MarkdownEditorCodeLanguage>
  );
}
