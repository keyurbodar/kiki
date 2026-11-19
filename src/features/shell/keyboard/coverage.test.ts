import { describe, expect, it } from "vitest";
import { createPlusMenuCommands } from "@/components/composer/plus-menu-commands";
import { createSelectionCardCommands } from "@/components/selection-card";
import { createPaletteCommands } from "@/features/command-palette/palette/command-palette-host";
import {
  commandCatalog,
  commandLabels,
  desktopCommands,
} from "@/features/settings/shortcuts-page/keybindings";
import { createShellCommands } from "@/features/shell/app-layout/shell-commands";
import {
  createComposerCommands,
  createThreadCommands,
} from "@/features/thread/thread-route/thread-commands";
import { createTabStripCommands } from "@/features/thread-panes/tab-strip/tab-strip-commands";
import { unboundCommands } from "./unbound";

const noop = () => undefined;

/** The real maps the surfaces register, built with inert dependencies. */
const surfaces = {
  shell: createShellCommands(() => ({
    toggleSidebar: noop,
    toggleSidebarMode: noop,
    newThread: noop,
    openSettings: noop,
    back: noop,
    forward: noop,
    stepThread: noop,
    jumpThread: noop,
  })),
  thread: createThreadCommands(() => ({
    openPane: noop,
    closePane: noop,
    isDockOpen: () => false,
    toggleExpanded: noop,
<<<<<<< HEAD
    stopRun: noop,
=======
    searchFiles: noop,
>>>>>>> origin/main
  })),
  strip: createTabStripCommands(() => ({
    close: noop,
    reopen: noop,
    step: noop,
    openBrowser: noop,
    newSideThread: noop,
  })),
  composer: createComposerCommands(() => ({ focus: noop, stop: () => false })),
  plusMenu: createPlusMenuCommands(() => ({ attach: () => undefined })),
  palette: createPaletteCommands({ toggle: noop }),
  selectionCard: createSelectionCardCommands(() => ({
    comment: () => false,
  })),
};

const bound = new Map<string, string>(
  Object.entries(surfaces).flatMap(([surface, commands]) =>
    Object.keys(commands).map((command) => [command, surface] as const),
  ),
);

const catalogIds = commandCatalog.map((row) => row.command);

describe("shortcut coverage", () => {
  it("binds a handler for every printed shortcut that has a live surface", () => {
    const missing = commandCatalog
      .filter((row) => row.defaults.length > 0)
      .filter(
        (row) => !bound.has(row.command) && !(row.command in unboundCommands),
      )
      .map((row) => row.command);
    expect(missing).toEqual([]);
  });

  it("prints a label for every handler", () => {
    expect(
      [...bound.keys()].filter((command) => !catalogIds.includes(command)),
    ).toEqual([]);
    for (const command of bound.keys())
      expect(commandLabels[command] ?? "").not.toBe("");
  });

  it("accounts for every catalog row exactly once", () => {
    const both = catalogIds.filter(
      (command) => bound.has(command) && command in unboundCommands,
    );
    expect(both).toEqual([]);
    expect(
      catalogIds.filter(
        (command) => !bound.has(command) && !(command in unboundCommands),
      ),
    ).toEqual([]);
  });

  it("states a reason for every command it cannot run", () => {
    for (const [command, reason] of Object.entries(unboundCommands)) {
      expect(catalogIds).toContain(command);
      expect(reason.length).toBeGreaterThan(20);
    }
  });

  it("classifies the desktop commands, which have no window tabs here", () => {
    for (const command of desktopCommands)
      expect(bound.has(command) || command in unboundCommands).toBe(true);
    // The dock's strip prints Capy's desktop tab chords beside its own rows, so
    // close and reopen act on pane tabs; history is the router's own.
    expect(
      [...desktopCommands].filter((command) => bound.has(command)),
    ).toEqual(["history.back", "history.forward", "tab.close", "tab.reopen"]);
  });
});
