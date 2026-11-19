import type { CommandHandlers } from "@/features/shell/keyboard";

/**
 * The card's one command. `comment` answers whether it handled the press, so a
 * scope whose card has already gone falls through to the next surface.
 */
export const createSelectionCardCommands = (
  get: () => { comment: () => boolean },
): CommandHandlers => ({
  "selection.comment": () => get().comment(),
});
