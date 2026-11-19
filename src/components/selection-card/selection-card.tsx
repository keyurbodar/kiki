import { useEffect, useRef } from "react";
import {
  SelectionToolbar,
  type SelectionToolbarProps,
} from "@/components/composer";
import { registerCommands, shortcutGlyphText } from "@/features/shell/keyboard";
import { createSelectionCardCommands } from "./selection-commands";
import type { CardSelection } from "./use-selection-card";

export type SelectionCardProps = {
  selection: CardSelection | null;
  /** Opens the surface's own comment path on the quoted text. */
  onComment: () => void;
  onCopy?: () => void;
  side?: SelectionToolbarProps["side"];
  bottom?: number;
  /** Whether this card's surface can start a comment at all. */
  commentable?: boolean;
};

/**
 * Capy's action card over a text selection: Comment and Copy, the shortcut
 * chip printed from the dispatcher's own binding so a rebind in Settings moves
 * both. The card registers `selection.comment` for as long as it is showing,
 * which is what makes the shortcut and the button the same row.
 */
export function SelectionCard({
  selection,
  onComment,
  onCopy,
  side,
  bottom,
  commentable = true,
}: SelectionCardProps) {
  const shown = selection !== null;
  const onCommentRef = useRef(onComment);
  onCommentRef.current = onComment;
  const showing = useRef(shown);
  showing.current = shown;
  useEffect(() => {
    if (!shown) return;
    return registerCommands(
      createSelectionCardCommands(() => ({
        comment: () => {
          if (!showing.current) return false;
          onCommentRef.current();
          return true;
        },
      })),
      { when: () => showing.current },
    );
  }, [shown]);
  if (!commentable) return null;
  return (
    <SelectionToolbar
      selection={selection ?? undefined}
      side={side}
      bottom={bottom}
      commentShortcut={shortcutGlyphText("selection.comment")}
      onComment={onComment}
      onCopy={onCopy}
    />
  );
}
