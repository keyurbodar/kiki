import { useCallback, useEffect, useRef, useState } from "react";
import {
  placeQuoteBox,
  QUOTABLE_SELECTOR,
  type QuoteBoxPlacement,
  resolveSelection,
  type SelectionAnchor,
} from "./selection-anchor";

/** What an open quote box was opened on, and where it sits. */
export type QuoteBoxState = {
  anchor: SelectionAnchor;
  placement: QuoteBoxPlacement;
  initialValue: string;
};

const EDITABLE_TARGET =
  'input, textarea, select, button, a[href], [role="menuitem"], [contenteditable="true"]';

/**
 * Watches text selection inside the thread's timeline and keeps the quote
 * toolbar's anchor current: it appears where the selection ends, follows the
 * timeline as it scrolls, and goes away when the selection does, on Escape, or
 * when a quote box opens on it.
 *
 * Capy's own listener set is the model: a press inside a quotable block
 * latches the selection on pointerup (so a drag does not re-measure per mouse
 * move), a selection change with nothing selected clears it, and Escape
 * clears the document selection outright. Typing a printable character while
 * the toolbar shows opens the quote box seeded with that character, which is
 * how Capy starts a quote by typing.
 */
export function useMessageSelection(container: Element | null) {
  const [anchor, setAnchor] = useState<SelectionAnchor | null>(null);
  const [box, setBox] = useState<QuoteBoxState | null>(null);
  const anchorRef = useRef<SelectionAnchor | null>(null);
  const boxRef = useRef<QuoteBoxState | null>(null);
  const pressed = useRef(false);
  const pointerX = useRef<number | null>(null);
  const frame = useRef(0);

  const publish = useCallback((next: SelectionAnchor | null) => {
    anchorRef.current = next;
    setAnchor(next);
  }, []);

  const update = useCallback(
    (x: number | null) => {
      publish(container === null ? null : resolveSelection(container, x));
    },
    [container, publish],
  );

  const clear = useCallback(() => {
    publish(null);
    (container?.ownerDocument ?? document).getSelection()?.removeAllRanges();
  }, [container, publish]);

  const openBox = useCallback(
    (initialValue: string) => {
      const current = anchorRef.current;
      if (current === null) return;
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight,
      };
      const next = {
        anchor: current,
        placement: placeQuoteBox(current.rect, current.focus.x, viewport),
        initialValue,
      };
      boxRef.current = next;
      setBox(next);
      publish(null);
      (container?.ownerDocument ?? document).getSelection()?.removeAllRanges();
    },
    [container, publish],
  );

  /** Hides the toolbar without touching the document selection, as Copy does. */
  const dismiss = useCallback(() => publish(null), [publish]);

  const closeBox = useCallback(() => {
    boxRef.current = null;
    setBox(null);
  }, []);

  useEffect(() => {
    if (container === null) return;
    const doc = container.ownerDocument ?? document;
    const schedule = (x: number | null) => {
      cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => update(x));
    };

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest('[data-slot="selection-toolbar"]') !== null) return;
      if (target.closest('[data-slot="selection-box"]') !== null) return;
      pressed.current = target.closest(QUOTABLE_SELECTOR) !== null;
      pointerX.current = event.clientX;
      if (!pressed.current) {
        cancelAnimationFrame(frame.current);
        publish(null);
      }
    };
    const onPointerUp = (event: PointerEvent) => {
      if (!pressed.current) return;
      pressed.current = false;
      pointerX.current = event.clientX;
      schedule(event.clientX);
    };
    const onSelectionChange = () => {
      const selection = doc.getSelection();
      if (selection === null || selection.isCollapsed) {
        cancelAnimationFrame(frame.current);
        publish(null);
        return;
      }
      if (!pressed.current) schedule(pointerX.current);
    };
    const onScroll = () => schedule(pointerX.current);
    const onResize = () => schedule(pointerX.current);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && anchorRef.current !== null) {
        cancelAnimationFrame(frame.current);
        clear();
        return;
      }
      if (
        boxRef.current !== null ||
        anchorRef.current === null ||
        !anchorRef.current.visible ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        event.isComposing ||
        event.key.length !== 1 ||
        (event.target instanceof Element &&
          event.target.closest(EDITABLE_TARGET) !== null)
      )
        return;
      event.preventDefault();
      openBox(event.key);
    };

    /**
     * Capy re-measures on a Shift+Arrow release: the focus moved with the
     * keyboard, so the card has to follow the selection instead of the pointer
     * that made it.
     */
    const onKeyUp = (event: KeyboardEvent) => {
      if (!event.key.startsWith("Arrow") || !event.shiftKey) return;
      pointerX.current = null;
      schedule(null);
    };

    doc.addEventListener("pointerdown", onPointerDown, true);
    doc.addEventListener("pointerup", onPointerUp, true);
    doc.addEventListener("selectionchange", onSelectionChange);
    doc.addEventListener("scroll", onScroll, true);
    doc.addEventListener("keydown", onKeyDown, true);
    doc.addEventListener("keyup", onKeyUp, true);
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(frame.current);
      doc.removeEventListener("pointerdown", onPointerDown, true);
      doc.removeEventListener("pointerup", onPointerUp, true);
      doc.removeEventListener("selectionchange", onSelectionChange);
      doc.removeEventListener("scroll", onScroll, true);
      doc.removeEventListener("keydown", onKeyDown, true);
      doc.removeEventListener("keyup", onKeyUp, true);
      window.removeEventListener("resize", onResize);
    };
  }, [clear, container, openBox, publish, update]);

  return {
    selection:
      box === null && anchor !== null && anchor.visible ? anchor : null,
    box,
    openBox,
    closeBox,
    dismiss,
  };
}
