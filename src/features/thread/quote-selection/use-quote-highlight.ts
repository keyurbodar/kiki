import { useEffect } from "react";

/** The CSS highlight Capy paints the quoted range with, styled in base.css. */
export const QUOTE_HIGHLIGHT = "selection-quote";

const supported = () =>
  typeof CSS !== "undefined" && "highlights" in CSS && "Highlight" in window;

/**
 * Keeps the quoted range painted while its quote box is open. The native
 * selection is cleared when the box opens, so without this the text the quote
 * came from looks untouched; Capy paints the same range under the same name.
 */
export function useQuoteHighlight(range: Range | null) {
  useEffect(() => {
    if (range === null || !supported()) return;
    CSS.highlights.set(QUOTE_HIGHLIGHT, new Highlight(range));
    return () => {
      CSS.highlights.delete(QUOTE_HIGHLIGHT);
    };
  }, [range]);
}
