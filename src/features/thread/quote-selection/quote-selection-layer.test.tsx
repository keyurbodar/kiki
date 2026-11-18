import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { ExcerptMention } from "@/features/thread/reply-quote";
import { QuoteSelectionLayer } from "./quote-selection-layer";
import { AGENT_SOURCE } from "./selection-anchor";

afterEach(() => {
  cleanup();
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

const TIMELINE = `
  <div data-chat-row-id="row_1">
    <div data-slot="agent-message">
      <div data-slot="message-section">
        <div data-component="markdown"><p id="first">All five of those are now with owners</p></div>
      </div>
      <div data-slot="message-footer"><button id="footer">Reply</button></div>
    </div>
  </div>
`;

const stubRange = () => {
  const proto = Range.prototype as unknown as Record<string, unknown>;
  const originalRect = proto.getBoundingClientRect;
  const originalRects = proto.getClientRects;
  proto.getBoundingClientRect = () => rect(369, 257, 805, 58.5);
  proto.getClientRects = () => [rect(369, 257, 805, 17.5)];
  return () => {
    proto.getBoundingClientRect = originalRect;
    proto.getClientRects = originalRects;
  };
};

const selectInMessage = () => {
  const timeline = document.createElement("div");
  timeline.innerHTML = TIMELINE;
  timeline.getBoundingClientRect = () => rect(0, 0, 837, 900) as DOMRect;
  document.body.append(timeline);
  const node = document.getElementById("first")?.firstChild as Text;
  const selection = document.getSelection();
  if (selection === null) throw new Error("missing selection");
  selection.setBaseAndExtent(node, 0, node, node.length);
  return { timeline, node };
};

const pressOn = (node: Node, clientX: number) => {
  const target = node.parentElement as Element;
  fireEvent.pointerDown(target, { clientX, bubbles: true });
  fireEvent.pointerUp(target, { clientX, bubbles: true });
};

const toolbar = () =>
  document.querySelector<HTMLElement>('[data-slot="selection-toolbar"]');

const box = () =>
  document.querySelector<HTMLElement>('[data-slot="selection-box"]');

const labels = () =>
  Array.from(toolbar()?.querySelectorAll("button") ?? []).map((button) =>
    button.getAttribute("aria-label"),
  );

describe("quote selection toolbar", () => {
  it("appears over a message selection with Comment and Copy", async () => {
    const restore = stubRange();
    const { timeline, node } = selectInMessage();
    render(
      <QuoteSelectionLayer container={timeline} onInsertQuote={() => {}} />,
    );
    try {
      pressOn(node, 500);
      await waitFor(() => expect(toolbar()).not.toBeNull());
      expect(labels()).toEqual(["Comment", "Copy"]);
    } finally {
      restore();
    }
  });

  it("keeps the overflow menu off until the thread has those actions", async () => {
    const restore = stubRange();
    const { timeline, node } = selectInMessage();
    render(
      <QuoteSelectionLayer container={timeline} onInsertQuote={() => {}} />,
    );
    try {
      pressOn(node, 500);
      await waitFor(() => expect(toolbar()).not.toBeNull());
      expect(labels()).not.toContain("More selection actions");
    } finally {
      restore();
    }
  });

  it("opens the quote box on Comment and closes it on Escape", async () => {
    const restore = stubRange();
    const { timeline, node } = selectInMessage();
    render(
      <QuoteSelectionLayer container={timeline} onInsertQuote={() => {}} />,
    );
    try {
      pressOn(node, 500);
      await waitFor(() => expect(toolbar()).not.toBeNull());
      const comment = toolbar()?.querySelector('[aria-label="Comment"]');
      if (comment === null || comment === undefined)
        throw new Error("no Comment");
      fireEvent.click(comment);
      await waitFor(() => expect(box()).not.toBeNull());
      expect(box()?.textContent).toContain("Quote from Capy");
      expect(toolbar()).toBeNull();
      const wrapper = box()?.parentElement as HTMLElement;
      expect(wrapper.style.width).toBe("480px");
      expect(wrapper.style.top).toBe("435.5px");
      expect(wrapper.style.left).toBe("260px");
      fireEvent.keyDown(box() as HTMLElement, { key: "Escape" });
      await waitFor(() => expect(box()).toBeNull());
    } finally {
      restore();
    }
  });

  it("hands the excerpt chip to the composer when a seeded quote is submitted", async () => {
    const restore = stubRange();
    const { timeline, node } = selectInMessage();
    const inserted: ExcerptMention[] = [];
    render(
      <QuoteSelectionLayer
        container={timeline}
        onInsertQuote={(mention) => inserted.push(mention)}
      />,
    );
    try {
      pressOn(node, 500);
      await waitFor(() => expect(toolbar()).not.toBeNull());
      fireEvent.keyDown(node.parentElement as Element, { key: "W" });
      await waitFor(() => expect(box()).not.toBeNull());
      await waitFor(() =>
        expect(
          box()?.querySelector('[aria-label="Add to prompt"]'),
        ).not.toBeNull(),
      );
      fireEvent.click(
        box()?.querySelector('[aria-label="Add to prompt"]') as Element,
      );
      await waitFor(() => expect(inserted).toHaveLength(1));
      const mention = inserted[0];
      expect(mention?.id).toBe("reply:row_1:0");
      expect(mention?.text).toContain(`<excerpt source="${AGENT_SOURCE}">`);
      expect(mention?.text).toContain("All five of those are now with owners");
      expect(mention?.text).toContain('<comment on="excerpt">\nW\n</comment>');
      expect(box()).toBeNull();
    } finally {
      restore();
    }
  });
});

describe("quote selection toolbar dismissal", () => {
  it("goes away when the selection collapses", async () => {
    const restore = stubRange();
    const { timeline, node } = selectInMessage();
    render(
      <QuoteSelectionLayer container={timeline} onInsertQuote={() => {}} />,
    );
    try {
      pressOn(node, 500);
      await waitFor(() => expect(toolbar()).not.toBeNull());
      document.getSelection()?.removeAllRanges();
      fireEvent(document, new Event("selectionchange"));
      await waitFor(() => expect(toolbar()).toBeNull());
    } finally {
      restore();
    }
  });

  it("ignores a selection that starts outside a message", async () => {
    const restore = stubRange();
    const { timeline } = selectInMessage();
    const outside = document.createElement("p");
    outside.id = "outside";
    outside.textContent = "not a message";
    timeline.append(outside);
    const node = outside.firstChild as Text;
    const selection = document.getSelection();
    selection?.setBaseAndExtent(node, 0, node, 8);
    render(
      <QuoteSelectionLayer container={timeline} onInsertQuote={() => {}} />,
    );
    try {
      pressOn(node, 500);
      await waitFor(() => expect(timeline.contains(outside)).toBe(true));
      expect(toolbar()).toBeNull();
    } finally {
      restore();
    }
  });
});
