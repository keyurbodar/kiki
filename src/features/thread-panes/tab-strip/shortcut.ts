import { shortcutGlyphText } from "@/features/shell/keyboard";

export const isMacPlatform = () =>
  typeof navigator === "undefined" ||
  /mac|iphone|ipad|ipod/i.test(navigator.platform);

export type ShortcutAction =
  | "browser.open"
  | "diffs.open"
  | "sideThread.new"
  | "shell.new"
  | "tab.close"
  | "tab.reopen"
  | "paneTab.previous"
  | "paneTab.next";

/**
 * Prints the binding the dispatcher matches, read from Settings' own table and
 * the `kiki:keybinds` overrides, so a rebind moves the chip with the handler.
 * A command this build cannot run prints nothing rather than a dead key.
 */
export const shortcutFor = (action: ShortcutAction) =>
  shortcutGlyphText(action) ?? "";
