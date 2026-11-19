import { createPortal } from "react-dom";
import { type ComposerPayload, SelectionBox } from "@/components/composer";
import { SelectionCard } from "@/components/selection-card";
import {
  type ExcerptMention,
  excerptMention,
} from "@/features/thread/reply-quote";
import { quoteTargetOf } from "./quote-target";
import { AGENT_SOURCE, type SelectionAnchor } from "./selection-anchor";
import { useMessageSelection } from "./use-message-selection";
import { useQuoteHighlight } from "./use-quote-highlight";

export type QuoteSelectionLayerProps = {
  /** The timeline viewport the selection has to start inside. */
  container: Element | null;
  /** Puts the excerpt chip in the composer. */
  onInsertQuote: (mention: ExcerptMention) => void;
};

const tooltip = (selection: SelectionAnchor) => ({
  text: selection.text,
  rect: selection.line,
  focus: selection.focus,
});

/**
 * Capy's message selection toolbar over the thread's timeline and the quote box
 * Comment opens on it. The toolbar carries Comment and Copy; the overflow menu
 * (Fork, Fork summary, Side chat) mounts only once the thread has those
 * actions, because a row that opens nothing is worse than an absent row.
 *
 * Comment opens the same selection box the composer uses: the quote is the
 * caption, the box's text becomes the excerpt's comment, and submitting hands
 * the excerpt chip to the composer.
 */
export function QuoteSelectionLayer({
  container,
  onInsertQuote,
}: QuoteSelectionLayerProps) {
  const { selection, box, openBox, closeBox, dismiss } =
    useMessageSelection(container);
  useQuoteHighlight(box?.anchor.range ?? null);

  const submit = (payload: ComposerPayload) => {
    if (box === null) return false;
    const target = quoteTargetOf(box.anchor.range.startContainer);
    if (target === null) {
      closeBox();
      return false;
    }
    onInsertQuote(
      excerptMention(
        {
          rowId: target.rowKey,
          section: target.section,
          text: box.anchor.text,
          source: box.anchor.source,
        },
        payload.text.trim(),
      ),
    );
    closeBox();
    return true;
  };

  return (
    <>
      <SelectionCard
        selection={selection === null ? null : tooltip(selection)}
        side={selection?.side}
        onComment={() => openBox("")}
        onCopy={dismiss}
      />
      {box !== null &&
        createPortal(
          <div
            className="fixed z-(--z-overlay-content)"
            style={{
              top: box.placement.top,
              left: box.placement.left,
              width: box.placement.width,
            }}
          >
            <SelectionBox
              caption={
                box.anchor.source === AGENT_SOURCE ? "Quote from Capy" : "Quote"
              }
              initialValue={box.initialValue}
              targets={["agent"]}
              target="agent"
              surface="overlay"
              onSubmit={submit}
              onClose={closeBox}
            />
          </div>,
          document.body,
        )}
    </>
  );
}
