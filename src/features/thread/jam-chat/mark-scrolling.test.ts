import { afterEach, describe, expect, it, vi } from "vitest";
import { markScrolling, SCROLLING_LINGER_MS } from "./mark-scrolling";

afterEach(() => {
  vi.useRealTimers();
});

describe("markScrolling", () => {
  it("marks the scroller and clears the flag after the linger", () => {
    vi.useFakeTimers();
    const node = document.createElement("div");

    markScrolling(node);
    expect(node.hasAttribute("data-scrolling")).toBe(true);

    vi.advanceTimersByTime(SCROLLING_LINGER_MS - 1);
    expect(node.hasAttribute("data-scrolling")).toBe(true);

    vi.advanceTimersByTime(1);
    expect(node.hasAttribute("data-scrolling")).toBe(false);
  });

  it("keeps two scrollers' timers apart", () => {
    vi.useFakeTimers();
    const first = document.createElement("div");
    const second = document.createElement("div");

    markScrolling(first, 100);
    markScrolling(second, 100);
    vi.advanceTimersByTime(50);
    markScrolling(first, 100);
    vi.advanceTimersByTime(60);

    expect(second.hasAttribute("data-scrolling")).toBe(false);
    expect(first.hasAttribute("data-scrolling")).toBe(true);
  });
});
