import { useCallback, useEffect, useRef, useState } from "react";

/** What the card needs from a selection to place itself and quote it. */
export type CardSelection = {
  text: string;
  rect: { top: number; height: number };
  focus: { x: number };
};

const ELEMENT_NODE = 1;

const elementOf = (node: Node | null): Element | null => {
  if (node === null) return null;
  if (node.nodeType === ELEMENT_NODE) return node as Element;
  return node.parentElement;
};

/**
 * Tracks a text selection made inside one container, for the action card Capy
 * shows over it. It publishes only when the selection is non-empty and wholly
 * inside `container`, so a plain click — which collapses the range — never
 * shows the card, and the container's own text still selects and copies
 * natively because nothing here prevents a mouse or keyboard event.
 */
export function useSelectionCard(container: HTMLElement | null) {
  const [selection, setSelection] = useState<CardSelection | null>(null);
  const shown = useRef(false);
  shown.current = selection !== null;

  const measure = useCallback(() => {
    const doc = container?.ownerDocument ?? document;
    const current = doc.getSelection();
    if (container === null || current === null || current.isCollapsed) {
      setSelection(null);
      return;
    }
    const text = current.toString().trim();
    if (text === "" || current.rangeCount === 0) {
      setSelection(null);
      return;
    }
    const range = current.getRangeAt(0);
    const start = elementOf(range.startContainer);
    const end = elementOf(range.endContainer);
    if (
      start === null ||
      end === null ||
      !container.contains(start) ||
      !container.contains(end)
    ) {
      setSelection(null);
      return;
    }
    const rects = range.getClientRects();
    const last = rects[rects.length - 1] ?? range.getBoundingClientRect();
    setSelection({
      text: current.toString(),
      rect: { top: last.top, height: last.height },
      focus: { x: last.right },
    });
  }, [container]);

  useEffect(() => {
    if (container === null) setSelection(null);
  }, [container]);

  useEffect(() => {
    const doc = container?.ownerDocument ?? document;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || !shown.current) return;
      setSelection(null);
      doc.getSelection()?.removeAllRanges();
    };
    doc.addEventListener("selectionchange", measure);
    doc.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", measure, true);
    window.addEventListener("resize", measure);
    return () => {
      doc.removeEventListener("selectionchange", measure);
      doc.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", measure, true);
      window.removeEventListener("resize", measure);
    };
  }, [container, measure]);

  const dismiss = useCallback(() => {
    setSelection(null);
    (container?.ownerDocument ?? document).getSelection()?.removeAllRanges();
  }, [container]);

  return { selection, dismiss };
}
