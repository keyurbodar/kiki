import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  openCommandPalette,
  subscribeCommandPaletteOpen,
  useCommandPaletteOpen,
} from "./command-palette-events";

describe("command palette events", () => {
  it("delivers the intent to subscribers until they unsubscribe", () => {
    const handler = vi.fn();
    const unsubscribe = subscribeCommandPaletteOpen(handler);
    openCommandPalette();
    openCommandPalette("projects");
    unsubscribe();
    openCommandPalette();
    expect(handler.mock.calls).toEqual([
      [{ intent: null }],
      [{ intent: "projects" }],
    ]);
  });

  it("calls the latest handler from the hook and stops on unmount", () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender, unmount } = renderHook(
      ({ handler }) => useCommandPaletteOpen(handler),
      { initialProps: { handler: first } },
    );
    rerender({ handler: second });
    openCommandPalette();
    unmount();
    openCommandPalette();
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });
});
