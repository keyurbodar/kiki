import { $isListItemNode, $isListNode } from "@lexical/list";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $addUpdateTag,
  $getNodeByKey,
  $getSelection,
  $isParagraphNode,
  $isRangeSelection,
  $isRootNode,
  $isTextNode,
  BLUR_COMMAND,
  COMMAND_PRIORITY_HIGH,
  type EditorState,
  HISTORIC_TAG,
  HISTORY_MERGE_TAG,
  HISTORY_PUSH_TAG,
  KEY_BACKSPACE_COMMAND,
  mergeRegister,
  UNDO_COMMAND,
} from "lexical";
import { useEffect } from "react";
import { $getListItemChecked } from "./nodes";

const CHECK_MARKER = /^\[([ xX]?)\] $/;

export const SLASH_PLACEHOLDER = "Type '/' for commands";

export function CheckListShortcutPlugin() {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    let undoable: EditorState | null = null;
    return mergeRegister(
      editor.registerUpdateListener(
        ({ editorState, prevEditorState, tags, dirtyLeaves }) => {
          if (tags.has(HISTORY_PUSH_TAG) && !tags.has(HISTORIC_TAG)) {
            undoable = editorState;
            return;
          }
          const merged =
            undoable === prevEditorState && tags.has(HISTORY_MERGE_TAG);
          undoable = merged ? editorState : null;
          if (merged || tags.has(HISTORIC_TAG) || editor.isComposing()) return;
          const match = editorState.read(() => {
            const selection = $getSelection();
            if (!$isRangeSelection(selection) || !selection.isCollapsed())
              return null;
            const node = selection.anchor.getNode();
            const offset = selection.anchor.offset;
            const item = node.getParent();
            const list = item?.getParent();
            if (
              !$isTextNode(node) ||
              !dirtyLeaves.has(node.getKey()) ||
              !$isListItemNode(item) ||
              item.getFirstChild() !== node ||
              !$isListNode(list) ||
              list.getListType() === "number" ||
              $getListItemChecked(item) !== undefined
            )
              return null;
            const marker = CHECK_MARKER.exec(
              node.getTextContent().slice(0, offset),
            );
            const typedLast = prevEditorState.read(() => {
              const previous = $getSelection();
              return (
                $isRangeSelection(previous) &&
                previous.anchor.offset === offset - 1
              );
            });
            return marker === null || !typedLast
              ? null
              : {
                  key: node.getKey(),
                  offset,
                  checked: marker[1]?.toLowerCase() === "x",
                };
          });
          if (match === null) return;
          editor.update(() => {
            const node = $getNodeByKey(match.key);
            const item = node?.getParent();
            const list = item?.getParent();
            if (
              !$isTextNode(node) ||
              !$isListItemNode(item) ||
              !$isListNode(list)
            )
              return;
            const [marker, rest] = node.splitText(match.offset);
            marker?.remove();
            if (rest === undefined) item.selectStart();
            else rest.select(0, 0);
            list.setListType("check");
            item.setChecked(match.checked);
            $addUpdateTag(HISTORY_PUSH_TAG);
          });
        },
      ),
      editor.registerCommand(
        KEY_BACKSPACE_COMMAND,
        (event) => {
          if (undoable === null || editor.getEditorState() !== undoable)
            return false;
          event.preventDefault();
          undoable = null;
          return editor.dispatchCommand(UNDO_COMMAND, undefined);
        },
        COMMAND_PRIORITY_HIGH,
      ),
    );
  }, [editor]);
  return null;
}

const $emptyParagraphKey = () => {
  const selection = $getSelection();
  if (!$isRangeSelection(selection) || !selection.isCollapsed()) return null;
  const block = selection.anchor.getNode().getTopLevelElement();
  return $isParagraphNode(block) &&
    block.getChildrenSize() === 0 &&
    $isRootNode(block.getParent())
    ? block.getKey()
    : null;
};

export function SlashPlaceholderPlugin() {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    let marked: HTMLElement | null = null;
    const mark = (element: HTMLElement | null) => {
      if (marked === element) return;
      marked?.removeAttribute("data-placeholder");
      element?.setAttribute("data-placeholder", SLASH_PLACEHOLDER);
      marked = element;
    };
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        const key = editorState.read($emptyParagraphKey);
        mark(
          key === null || !editor.isEditable()
            ? null
            : editor.getElementByKey(key),
        );
      }),
      editor.registerCommand(
        BLUR_COMMAND,
        () => {
          mark(null);
          return false;
        },
        COMMAND_PRIORITY_HIGH,
      ),
      () => mark(null),
    );
  }, [editor]);
  return null;
}
