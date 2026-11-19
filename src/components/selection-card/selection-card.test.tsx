import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SelectionCard } from "./selection-card";
import { useSelectionCard } from "./use-selection-card";

afterEach(cleanup);

function Surface({ onComment }: { onComment: () => void }) {
  const [body, setBody] = useState<HTMLDivElement | null>(null);
  const card = useSelectionCard(body);
  return (
    <>
      <div id="body" ref={setBody}>
        <p>The retry budget is counted per attempt.</p>
      </div>
      <SelectionCard
        selection={card.selection}
        onComment={onComment}
        onCopy={card.dismiss}
      />
    </>
  );
}

function Collapsible() {
  const [open, setOpen] = useState(true);
  const [body, setBody] = useState<HTMLDivElement | null>(null);
  const card = useSelectionCard(open ? body : null);
  return (
    <>
      <button type="button" onClick={() => setOpen(false)}>
        Collapse
      </button>
      <div ref={setBody}>
        <p>The retry budget is counted per attempt.</p>
      </div>
      <SelectionCard selection={card.selection} onComment={() => {}} />
    </>
  );
}

const selectInside = () => {
  const paragraph = screen.getByText(/retry budget/);
  const range = document.createRange();
  range.selectNodeContents(paragraph);
  act(() => {
    const selection = document.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    document.dispatchEvent(new Event("selectionchange"));
  });
};

const collapse = () => {
  act(() => {
    document.getSelection()?.removeAllRanges();
    document.dispatchEvent(new Event("selectionchange"));
  });
};

describe("the selection card", () => {
  it("shows while text inside its container is selected, not on a bare click", async () => {
    render(<Surface onComment={() => {}} />);
    expect(
      document.querySelector('[data-slot="selection-toolbar"]'),
    ).toBeNull();
    selectInside();
    await waitFor(() =>
      expect(
        document.querySelector('[data-slot="selection-toolbar"]'),
      ).not.toBeNull(),
    );
    collapse();
    await waitFor(() =>
      expect(
        document.querySelector('[data-slot="selection-toolbar"]'),
      ).toBeNull(),
    );
  });

  it("goes away when its container goes away", async () => {
    render(<Collapsible />);
    selectInside();
    await screen.findByRole("button", { name: "Comment" });
    fireEvent.click(screen.getByRole("button", { name: "Collapse" }));
    await waitFor(() =>
      expect(
        document.querySelector('[data-slot="selection-toolbar"]'),
      ).toBeNull(),
    );
  });

  it("goes away on Escape", async () => {
    render(<Surface onComment={() => {}} />);
    selectInside();
    await screen.findByRole("button", { name: "Comment" });
    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() =>
      expect(
        document.querySelector('[data-slot="selection-toolbar"]'),
      ).toBeNull(),
    );
  });

  it("starts a comment from the button", async () => {
    const onComment = vi.fn();
    render(<Surface onComment={onComment} />);
    selectInside();
    fireEvent.click(await screen.findByRole("button", { name: "Comment" }));
    expect(onComment).toHaveBeenCalledTimes(1);
  });

  it("starts the same comment from the bound shortcut", async () => {
    const onComment = vi.fn();
    render(<Surface onComment={onComment} />);
    selectInside();
    await screen.findByRole("button", { name: "Comment" });
    fireEvent.keyDown(document.body, {
      key: "m",
      ctrlKey: true,
      shiftKey: true,
    });
    expect(onComment).toHaveBeenCalledTimes(1);
  });
});
