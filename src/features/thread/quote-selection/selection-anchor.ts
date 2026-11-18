/**
 * Resolves the text selection inside a thread's timeline into what the quote
 * toolbar needs: the selected text, who it came from, the visual line it ends
 * on, and where the floating toolbar and the quote box go. Capy's own
 * `shared/thread/quote-selection` does the same work; the selectors and the
 * arithmetic here are its.
 */

/** A quotable block: markdown inside a chat row, so hover rails and chrome never quote. */
export const QUOTABLE_SELECTOR =
  '[data-chat-row-id] [data-component="markdown"]';

/** Text inside these is never quoted, even when the selection drags over it. */
export const SELECTION_EXCLUDED =
  'input, textarea, select, [contenteditable="true"], [data-slot="message-footer"]';

const MARKDOWN_SELECTOR = '[data-component="markdown"]';

/** The quote box never grows wider than Capy's 480, and keeps 8 from the window edge. */
export const QUOTE_BOX_MAX_WIDTH = 480;
export const QUOTE_BOX_EDGE = 8;
/** The box's top is clamped so at least this much of it stays on screen. */
export const QUOTE_BOX_BOTTOM_RESERVE = 200;

export const AGENT_SOURCE = "Capy's response";
export const USER_SOURCE = "User message";
export const MIXED_SOURCE = "Thread transcript";

export type RectLike = {
  top: number;
  left: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
};

export type RangeLike = {
  getBoundingClientRect: () => RectLike;
  getClientRects: () => ArrayLike<RectLike>;
};

export type LineBox = {
  top: number;
  left: number;
  width: number;
  height: number;
};

export type SelectionPlacement = {
  rect: RectLike;
  line: LineBox;
  side: "above" | "below";
  focus: { x: number; y: number };
};

export type SelectionAnchor = SelectionPlacement & {
  text: string;
  source: string;
  range: Range;
  backward: boolean;
  pointerX: number | null;
  visible: boolean;
};

export type QuoteBoxPlacement = {
  top: number;
  left: number;
  width: number;
};

/** The element a selection point belongs to; a text node answers with its parent. */
export const elementOf = (node: Node | null): Element | null => {
  if (node === null) return null;
  if (node instanceof Element) return node;
  return node.parentElement;
};

/**
 * True when the selection was dragged upward: its focus sits before its anchor,
 * which is what puts the toolbar above the line instead of below it.
 */
export function isBackward(selection: Selection): boolean {
  const { anchorNode, anchorOffset, focusNode, focusOffset } = selection;
  if (anchorNode === null || focusNode === null) return false;
  const probe = (anchorNode.ownerDocument ?? document).createRange();
  probe.setStart(anchorNode, anchorOffset);
  return probe.comparePoint(focusNode, focusOffset) < 0;
}

/**
 * The line the toolbar anchors to: the first line of an upward selection, the
 * last line of a downward one, measured against that line's own client rects so
 * a tall wrapped selection does not push the toolbar to the paragraph's edge.
 */
export function anchorLine(
  range: RangeLike,
  backward: boolean,
  pointerX: number | null,
): SelectionPlacement {
  const rect = range.getBoundingClientRect();
  const rects = Array.from(range.getClientRects()).filter(
    (item) => item.width > 0 && item.height > 0,
  );
  const edge = (backward ? rects[0] : rects.at(-1)) ?? rect;
  const sameLine = rects.filter((item) => {
    const middle = item.top + item.height / 2;
    return (
      middle >= edge.top &&
      middle <= edge.bottom &&
      item.height < edge.height * 2
    );
  });
  const top = Math.min(edge.top, ...sameLine.map((item) => item.top));
  const bottom = Math.max(edge.bottom, ...sameLine.map((item) => item.bottom));
  const left = Math.min(edge.left, ...sameLine.map((item) => item.left));
  const right = Math.max(edge.right, ...sameLine.map((item) => item.right));
  return {
    rect,
    line: { top, left, width: right - left, height: bottom - top },
    side: backward ? "above" : "below",
    focus: {
      x:
        pointerX === null
          ? backward
            ? left
            : right
          : Math.min(Math.max(pointerX, left), right),
      y: backward ? top : bottom,
    },
  };
}

/** Who the quoted text came from, from the message rows the quoted blocks sit in. */
export function quoteSource(roots: readonly Element[]): string {
  const fromUser = roots.filter(
    (root) => root.closest('[data-slot="user-message"]') !== null,
  );
  if (fromUser.length === 0) return AGENT_SOURCE;
  return fromUser.length === roots.length ? USER_SOURCE : MIXED_SOURCE;
}

export type QuoteText = { text: string; roots: Element[] };

/**
 * The selected text, keeping only what belongs to a markdown block: a drag
 * across a message must not sweep up footer buttons, hidden chrome or a file
 * preview's labels. Distinct blocks are joined with a newline, as Capy joins
 * them.
 */
export function quoteText(range: Range): QuoteText {
  const roots: Element[] = [];
  const parts: string[] = [];
  let current: Element | null = null;
  let collected = "";

  const flush = () => {
    if (current !== null && collected !== "") {
      roots.push(current);
      parts.push(collected);
    }
    current = null;
    collected = "";
  };

  const common = range.commonAncestorContainer;
  const root =
    common instanceof Element ? common : (common.parentElement ?? null);
  if (root === null) return { text: "", roots };

  const walker = (root.ownerDocument ?? document).createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
  );

  for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
    const text = node as Text;
    const length = text.data.length;
    if (length === 0) continue;
    if (range.comparePoint(text, length) < 0) continue;
    if (range.comparePoint(text, 0) > 0) continue;
    const parent = text.parentElement;
    if (parent === null) continue;
    if (parent.closest(SELECTION_EXCLUDED) !== null) continue;
    const root = parent.closest(MARKDOWN_SELECTOR);
    if (root === null) continue;
    if (root !== current) {
      flush();
      current = root;
    }
    const start =
      text === range.startContainer ? Math.min(range.startOffset, length) : 0;
    const end =
      text === range.endContainer ? Math.min(range.endOffset, length) : length;
    if (end > start) collected += text.data.slice(start, end);
  }
  flush();

  return {
    text: parts
      .join("\n")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/^\n+|\n+$/g, ""),
    roots,
  };
}

const intersects = (rect: RectLike, box: RectLike) =>
  rect.top + rect.height > box.top && rect.top < box.bottom;

/**
 * Everything the toolbar needs about the current selection, or null when there
 * is nothing worth quoting: no selection, a selection that starts outside a
 * quotable block, or text that is only whitespace.
 */
export function resolveSelection(
  container: Element,
  pointerX: number | null,
  selector: string = QUOTABLE_SELECTOR,
): SelectionAnchor | null {
  const selection = (container.ownerDocument ?? document).getSelection();
  if (selection === null || selection.isCollapsed || selection.rangeCount === 0)
    return null;
  const range = selection.getRangeAt(0).cloneRange();
  const startElement = elementOf(range.startContainer);
  const start = startElement?.closest(selector) ?? null;
  if (start === null || !container.contains(start)) return null;
  if (startElement?.closest(SELECTION_EXCLUDED) !== null) return null;
  if (selection.toString().trim() === "") return null;
  const quoted = quoteText(range);
  if (quoted.roots.length === 0 || quoted.text === "") return null;
  const endElement = elementOf(quoted.roots.at(-1) ?? null);
  if (endElement?.closest(SELECTION_EXCLUDED) !== null) return null;

  const backward = isBackward(selection);
  const placement = anchorLine(range, backward, pointerX);
  return {
    ...placement,
    text: quoted.text,
    source: quoteSource(quoted.roots),
    range,
    backward,
    pointerX,
    visible: intersects(placement.rect, container.getBoundingClientRect()),
  };
}

/**
 * Where the quote box lands: 8 under the selection's block, centred on the line
 * the toolbar was on, clamped inside the window on all three sides.
 */
export function placeQuoteBox(
  rect: RectLike,
  focusX: number,
  viewport: { width: number; height: number },
): QuoteBoxPlacement {
  const width = Math.min(
    QUOTE_BOX_MAX_WIDTH,
    viewport.width - QUOTE_BOX_EDGE * 2,
  );
  return {
    width,
    top: Math.min(
      rect.top + rect.height + QUOTE_BOX_EDGE,
      viewport.height - QUOTE_BOX_BOTTOM_RESERVE,
    ),
    left: Math.min(
      Math.max(QUOTE_BOX_EDGE, focusX - width / 2),
      viewport.width - width - QUOTE_BOX_EDGE,
    ),
  };
}
