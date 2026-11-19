import type { CommandHandlers } from "@/features/shell/keyboard";

/**
 * What the tab strip can do for a keybinding. It owns the commands it prints
 * beside its menu items, so the chip and the action come from one table.
 */
export type TabStripCommandDeps = {
  /** Closes the tab the printed shortcut targets, if it is closable. */
  close: () => boolean | undefined;
  reopen: () => boolean | undefined;
  /** Cycles the strip, chat tab included. */
  step: (delta: 1 | -1) => boolean | undefined;
  openBrowser: () => void;
  newSideThread: () => boolean | undefined;
};

export const createTabStripCommands = (
  read: () => TabStripCommandDeps,
): CommandHandlers => ({
  "tab.close": () => read().close(),
  "tab.reopen": () => read().reopen(),
  "paneTab.next": () => read().step(1),
  "paneTab.previous": () => read().step(-1),
  "browser.open": () => read().openBrowser(),
  "sideThread.new": () => read().newSideThread(),
});
