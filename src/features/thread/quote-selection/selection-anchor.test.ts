import { afterEach, describe, expect, it } from "vitest";
import {
  AGENT_SOURCE,
  anchorLine,
  elementOf,
  isBackward,
  MIXED_SOURCE,
  placeQuoteBox,
  QUOTE_BOX_BOTTOM_RESERVE,
  QUOTE_BOX_EDGE,
  QUOTE_BOX_MAX_WIDTH,
  quoteSource,
  quoteText,
  resolveSelection,
  USER_SOURCE,
} from "./selection-anchor";

afterEach(() => {
  document.body.innerHTML = "";
  document.getSelection()?.removeAllRanges();
});

const rect = (top: number, left: number, width: number, height: number) => ({
  top,
  left,
  width,
  height,
  right: left + width,
  bottom: top + height,
});

const rangeOf = (rects: ReturnType<typeof rect>[]) =>
  ({
    getBoundingClientRect: () => rects.at(-1) ?? rect(0, 0, 0, 0),
    getClientRects: () => rects,
  }) as never;

const select = (from: Text, start: number, to: Text, end: number) => {
  const range = document.createRange();
  range.setStart(from, start);
  range.setEnd(to, end);
  const selection = document.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
  return range;
};

const TIMELINE = `
  <div data-chat-row-id="row_1">
    <div data-slot="agent-message">
      <div data-slot="message-section">
        <div data-component="markdown"><p id="first">Alpha <b id="bold">beta</b> gamma</p></div>
      </div>
      <div data-slot="message-section">
        <div data-component="markdown"><p id="second">Second block</p></div>
      </div>
      <div data-slot="message-footer"><button id="footer">Reply</button></div>
    </div>
  </div>
  <div data-chat-row-id="row_2">
    <div data-slot="user-message">
      <div data-component="markdown"><p id="user">Mine</p></div>
    </div>
  </div>
  <div><p id="outside">Not a message</p></div>
`;

const mount = () => {
  const container = document.createElement("div");
  container.innerHTML = TIMELINE;
  container.getBoundingClientRect = () => rect(0, 0, 800, 600) as DOMRect;
  document.body.append(container);
  return container;
};

const text = (id: string) =>
  (document.getElementById(id)?.firstChild ?? null) as Text | null;

describe("anchorLine", () => {
  const lines = [rect(100, 40, 300, 20), rect(120, 40, 180, 20)];

  it("anchors a downward selection to its last line and puts the toolbar below", () => {
    const placement = anchorLine(rangeOf(lines), false, null);
    expect(placement.side).toBe("below");
    expect(placement.line).toEqual({
      top: 120,
      left: 40,
      width: 180,
      height: 20,
    });
    expect(placement.focus).toEqual({ x: 220, y: 140 });
  });

  it("anchors an upward selection to its first line and puts the toolbar above", () => {
    const placement = anchorLine(rangeOf(lines), true, null);
    expect(placement.side).toBe("above");
    expect(placement.line).toEqual({
      top: 100,
      left: 40,
      width: 300,
      height: 20,
    });
    expect(placement.focus).toEqual({ x: 40, y: 100 });
  });

  it("keeps the pointer's x inside the anchored line", () => {
    expect(anchorLine(rangeOf(lines), false, 170).focus.x).toBe(170);
    expect(anchorLine(rangeOf(lines), false, 900).focus.x).toBe(220);
    expect(anchorLine(rangeOf(lines), false, 4).focus.x).toBe(40);
  });

  it("measures the whole line, not just the rect the range reports", () => {
    const placement = anchorLine(
      rangeOf([rect(200, 64, 80, 20), rect(200, 150, 40, 20)]),
      false,
      null,
    );
    expect(placement.line).toEqual({
      top: 200,
      left: 64,
      width: 126,
      height: 20,
    });
    expect(placement.rect).toEqual(rect(200, 150, 40, 20));
  });
});

describe("isBackward", () => {
  it("reads a selection dragged upward as backward", () => {
    document.body.innerHTML = "<p id='p'>alpha beta</p>";
    const node = text("p");
    if (node === null) throw new Error("missing text");
    const selection = document.getSelection();
    if (selection === null) throw new Error("missing selection");
    selection.setBaseAndExtent(node, 9, node, 2);
    expect(isBackward(selection)).toBe(true);
    selection.setBaseAndExtent(node, 2, node, 9);
    expect(isBackward(selection)).toBe(false);
  });
});

describe("quoteSource", () => {
  it("names where the quoted blocks came from", () => {
    const container = mount();
    const agent = container.querySelector("#first") as Element;
    const user = container.querySelector("#user") as Element;
    expect(quoteSource([agent])).toBe(AGENT_SOURCE);
    expect(quoteSource([user])).toBe(USER_SOURCE);
    expect(quoteSource([agent, user])).toBe(MIXED_SOURCE);
  });
});

describe("quoteText", () => {
  it("quotes the selection and nothing around it", () => {
    const container = mount();
    const alpha = text("first") as Text;
    const bold = text("bold") as Text;
    const range = select(alpha, 0, bold, 2);
    const quoted = quoteText(range);
    expect(quoted.text).toBe("Alpha be");
    expect(quoted.roots).toHaveLength(1);
    expect(container.contains(quoted.roots[0] ?? null)).toBe(true);
  });

  it("joins two quoted blocks with a newline and leaves the footer out", () => {
    mount();
    const alpha = text("first") as Text;
    const second = text("second") as Text;
    const footer = text("footer") as Text;
    expect(quoteText(select(alpha, 0, second, 12)).text).toBe(
      "Alpha beta gamma\nSecond block",
    );
    const quoted = quoteText(select(alpha, 0, footer, 5)).text;
    expect(quoted).toBe("Alpha beta gamma\nSecond block");
    expect(quoted).not.toContain("Reply");
  });

  it("skips text that is not inside a markdown block", () => {
    mount();
    const outside = text("outside") as Text;
    expect(quoteText(select(outside, 0, outside, 12)).text).toBe("");
    expect(quoteText(select(outside, 0, outside, 12)).roots).toEqual([]);
  });
});

describe("resolveSelection", () => {
  const stubRange = (rects: ReturnType<typeof rect>[]) => {
    const proto = Range.prototype as unknown as Record<string, unknown>;
    const originalRect = proto.getBoundingClientRect;
    const originalRects = proto.getClientRects;
    proto.getBoundingClientRect = () => rects.at(-1) ?? rect(0, 0, 0, 0);
    proto.getClientRects = () => rects;
    return () => {
      proto.getBoundingClientRect = originalRect;
      proto.getClientRects = originalRects;
    };
  };

  it("resolves a selection inside a message into a quotable anchor", () => {
    const container = mount();
    const restore = stubRange([rect(100, 40, 300, 20), rect(120, 40, 180, 20)]);
    try {
      const alpha = text("first") as Text;
      const bold = text("bold") as Text;
      select(alpha, 0, bold, 2);
      const anchor = resolveSelection(container, 170);
      expect(anchor).not.toBeNull();
      expect(anchor?.text).toBe("Alpha be");
      expect(anchor?.source).toBe(AGENT_SOURCE);
      expect(anchor?.side).toBe("below");
      expect(anchor?.focus.x).toBe(170);
      expect(anchor?.visible).toBe(true);
    } finally {
      restore();
    }
  });

  it("ignores a selection outside a message row", () => {
    const container = mount();
    const outside = text("outside") as Text;
    select(outside, 0, outside, 6);
    expect(resolveSelection(container, null)).toBeNull();
  });

  it("ignores a collapsed or whitespace-only selection", () => {
    const container = mount();
    const alpha = text("first") as Text;
    const range = document.createRange();
    range.setStart(alpha, 5);
    range.collapse(true);
    const selection = document.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    expect(resolveSelection(container, null)).toBeNull();

    const space = text("first") as Text;
    select(space, 5, space, 6);
    expect(resolveSelection(container, null)).toBeNull();
  });
});

describe("placeQuoteBox", () => {
  const viewport = { width: 1200, height: 800 };

  it("sits under the quoted block, centred on the anchored line", () => {
    expect(placeQuoteBox(rect(300, 100, 400, 60), 420, viewport)).toEqual({
      width: QUOTE_BOX_MAX_WIDTH,
      top: 368,
      left: 180,
    });
  });

  it("keeps the box inside the window", () => {
    const narrow = placeQuoteBox(rect(700, 0, 200, 20), 20, {
      width: 400,
      height: 800,
    });
    expect(narrow.width).toBe(400 - QUOTE_BOX_EDGE * 2);
    expect(narrow.left).toBe(QUOTE_BOX_EDGE);
    expect(narrow.top).toBe(800 - QUOTE_BOX_BOTTOM_RESERVE);
  });
});

describe("elementOf", () => {
  it("walks a text node up to its element and passes elements through", () => {
    document.body.innerHTML = "<p id='p'>alpha</p>";
    const p = document.getElementById("p") as Element;
    expect(elementOf(p)).toBe(p);
    expect(elementOf(p.firstChild)).toBe(p);
    expect(elementOf(null)).toBeNull();
  });
});
