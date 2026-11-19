import type { CommandHandlers } from "@/features/shell/keyboard";

/**
 * What a thread route can do for a keybinding, read at event time. The pane
 * ids are the ones `findPane` knows, so a shortcut and the tab menu open the
 * same pane.
 */
export type ThreadCommandDeps = {
  openPane: (paneId: string) => void;
  closePane: () => void;
  isDockOpen: () => boolean;
  toggleExpanded: () => void;
  /** Opens the Files pane with its search field focused, as Capy's ⌘P does. */
  searchFiles: () => void;
};

export const createThreadCommands = (
  read: () => ThreadCommandDeps,
): CommandHandlers => ({
  "pane.toggle": () => {
    if (read().isDockOpen()) read().closePane();
    else read().openPane("overview");
  },
  "pane.fullscreen": () => {
    if (!read().isDockOpen()) return false;
    read().toggleExpanded();
  },
  "diffs.open": () => read().openPane("diffs"),
  "files.search": () => read().searchFiles(),
});

/** The composer's own keybindings, registered by the view that holds its editor. */
export type ComposerCommandDeps = {
  focus: () => void;
  /** Stops the running turn; false when nothing is running, so the key falls through. */
  stop: () => boolean;
};

export const createComposerCommands = (
  read: () => ComposerCommandDeps,
): CommandHandlers => ({
  "composer.focus": () => read().focus(),
  "thread.stop": () => read().stop(),
});
