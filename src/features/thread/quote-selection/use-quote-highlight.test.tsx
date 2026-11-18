import { cleanup, render } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { QUOTE_HIGHLIGHT, useQuoteHighlight } from "./use-quote-highlight";

const store = new Map<string, unknown>();

class FakeHighlight {
  constructor(readonly range: Range) {}
}

const install = () => {
  vi.stubGlobal("Highlight", FakeHighlight);
  vi.stubGlobal("CSS", {
    highlights: {
      set: (name: string, value: unknown) => store.set(name, value),
      delete: (name: string) => store.delete(name),
      keys: () => store.keys(),
    },
  });
};

afterEach(() => {
  cleanup();
  store.clear();
  vi.unstubAllGlobals();
});

const Probe = ({ range }: { range: Range | null }) => {
  useQuoteHighlight(range);
  return null;
};

it("paints the quoted range and drops the paint when it closes", () => {
  install();
  const range = document.createRange();
  const { rerender, unmount } = render(<Probe range={range} />);
  const painted = store.get(QUOTE_HIGHLIGHT) as FakeHighlight;
  expect(painted.range).toBe(range);
  rerender(<Probe range={null} />);
  expect(store.has(QUOTE_HIGHLIGHT)).toBe(false);
  rerender(<Probe range={range} />);
  expect(store.has(QUOTE_HIGHLIGHT)).toBe(true);
  unmount();
  expect(store.has(QUOTE_HIGHLIGHT)).toBe(false);
});
