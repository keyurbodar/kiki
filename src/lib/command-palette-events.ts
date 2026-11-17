import { useEffect } from "react";

export const COMMAND_PALETTE_OPEN_EVENT = "kiki:command-palette-open";

export type CommandPaletteOpenDetail = { intent: string | null };

export type CommandPaletteOpenHandler = (
  detail: CommandPaletteOpenDetail,
) => void;

export function openCommandPalette(intent: string | null = null) {
  window.dispatchEvent(
    new CustomEvent<CommandPaletteOpenDetail>(COMMAND_PALETTE_OPEN_EVENT, {
      detail: { intent },
    }),
  );
}

export function subscribeCommandPaletteOpen(
  handler: CommandPaletteOpenHandler,
) {
  const listener = (event: Event) =>
    handler((event as CustomEvent<CommandPaletteOpenDetail>).detail);
  window.addEventListener(COMMAND_PALETTE_OPEN_EVENT, listener);
  return () => window.removeEventListener(COMMAND_PALETTE_OPEN_EVENT, listener);
}

export function useCommandPaletteOpen(handler: CommandPaletteOpenHandler) {
  useEffect(() => subscribeCommandPaletteOpen(handler), [handler]);
}
