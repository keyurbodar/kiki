import { cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { KEYBINDS_KEY, useShortcutChord } from "./store";

afterEach(() => {
  cleanup();
  window.localStorage.removeItem(KEYBINDS_KEY);
});

describe("useShortcutChord", () => {
  it("prints the chord the command is bound to now", () => {
    const { result } = renderHook(() => useShortcutChord("thread.new"));
    expect(result.current).toMatch(/(Ctrl|⌘)\+.*O$/);
  });

  it("follows a rebind, because it reads the same table the dispatcher does", () => {
    const { result: before } = renderHook(() => useShortcutChord("thread.new"));
    window.localStorage.setItem(
      KEYBINDS_KEY,
      JSON.stringify({ "thread.new": ["mod+alt+n"] }),
    );
    const { result: after } = renderHook(() => useShortcutChord("thread.new"));
    expect(after.current).not.toBe(before.current);
    expect(after.current).toMatch(/(Ctrl|⌘)\+.*N$/);
  });

  it("prints nothing for a command the table cannot run", () => {
    const { result } = renderHook(() => useShortcutChord("shell.focus"));
    expect(result.current).toBeUndefined();
  });
});
