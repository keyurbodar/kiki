import type { CommandHandlers } from "@/features/shell/keyboard";

/**
 * The attach menu's own keybinding, registered by the menu that owns the file
 * input the shortcut opens.
 */
export const createPlusMenuCommands = (
  read: () => { attach: () => boolean | undefined },
): CommandHandlers => ({
  "composer.attach": () => read().attach(),
});
