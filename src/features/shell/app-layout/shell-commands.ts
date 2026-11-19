import type { CommandHandlers } from "@/features/shell/keyboard";

/**
 * What the app shell can do for a keybinding. Read at event time, so a handler
 * always acts on the shell as it stands rather than on the render that
 * registered it.
 */
export type ShellCommandDeps = {
  toggleSidebar: () => void;
  toggleSidebarMode: () => void;
  newThread: () => void;
  openSettings: () => void;
  back: () => void;
  forward: () => void;
  /** Moves to the neighbouring thread in the sidebar's own order. */
  stepThread: (delta: 1 | -1) => void;
  /** Opens the thread printed at 1–9 in the sidebar's order. */
  jumpThread: (index: number) => void;
};

/**
 * The shell's keybindings. Every command here is printed in Settings →
 * Shortcuts; the coverage test fails if this map and the catalog disagree.
 */
export const createShellCommands = (
  read: () => ShellCommandDeps,
): CommandHandlers => ({
  "sidebar.toggle": () => read().toggleSidebar(),
  "sidebar.mode": () => read().toggleSidebarMode(),
  "thread.new": () => read().newThread(),
  "settings.open": () => read().openSettings(),
  "history.back": () => read().back(),
  "history.forward": () => read().forward(),
  "thread.previous": () => read().stepThread(-1),
  "thread.next": () => read().stepThread(1),
  "thread.jump": (event) => {
    const index = Number.parseInt(event.key, 10);
    if (Number.isNaN(index)) return false;
    read().jumpThread(index - 1);
  },
});
