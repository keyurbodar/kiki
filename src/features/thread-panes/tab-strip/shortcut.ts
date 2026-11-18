/** Capy's default bindings for the actions the tab strip shows. */
export const SHORTCUTS = {
  "browser.open": "mod+shift+l",
  "diffs.open": "mod+shift+g",
  "sideThread.new": "mod+shift+s",
  "shell.new": "ctrl+shift+`",
  "tab.close": "mod+w",
  "tab.reopen": "mod+shift+t",
  "paneTab.previous": "mod+alt+shift+arrowleft",
  "paneTab.next": "mod+alt+shift+arrowright",
} as const;

export type ShortcutAction = keyof typeof SHORTCUTS;

const KEY_GLYPHS: Record<string, string> = {
  arrowleft: "←",
  arrowright: "→",
  arrowup: "↑",
  arrowdown: "↓",
  backspace: "⌫",
  enter: "↵",
  escape: "Esc",
  space: "Space",
};

export const isMacPlatform = () =>
  typeof navigator === "undefined" ||
  /mac|iphone|ipad|ipod/i.test(navigator.platform);

/** Formats a binding like `mod+shift+l` the way Capy prints it. */
export function formatShortcut(binding: string, mac: boolean): string {
  const parts = binding.split("+");
  const key = parts.at(-1) ?? "";
  const has = (modifier: string) => parts.slice(0, -1).includes(modifier);
  const meta = has("meta") || (has("mod") && mac);
  const ctrl = has("ctrl") || (has("mod") && !mac);
  const glyph =
    KEY_GLYPHS[key] ??
    (key.length === 1
      ? key.toUpperCase()
      : key.charAt(0).toUpperCase() + key.slice(1));
  const modifiers = (
    mac
      ? [ctrl && "⌃", has("alt") && "⌥", has("shift") && "⇧", meta && "⌘"]
      : [
          ctrl && "Ctrl",
          has("alt") && "Alt",
          has("shift") && "Shift",
          meta && "Meta",
        ]
  ).filter((modifier) => typeof modifier === "string");
  return mac ? modifiers.join("") + glyph : [...modifiers, glyph].join("+");
}

export const shortcutFor = (action: ShortcutAction) =>
  formatShortcut(SHORTCUTS[action], isMacPlatform());

/** Whether a keydown is the binding we print, so the label and the handler cannot drift. */
export function matchesShortcut(
  binding: string,
  event: Pick<
    KeyboardEvent,
    "key" | "metaKey" | "ctrlKey" | "altKey" | "shiftKey"
  >,
  mac = isMacPlatform(),
): boolean {
  const parts = binding.split("+");
  const key = (parts.at(-1) ?? "").toLowerCase();
  const has = (modifier: string) => parts.slice(0, -1).includes(modifier);
  const meta = has("meta") || (has("mod") && mac);
  const ctrl = has("ctrl") || (has("mod") && !mac);
  return (
    event.metaKey === meta &&
    event.ctrlKey === ctrl &&
    event.altKey === has("alt") &&
    event.shiftKey === has("shift") &&
    event.key.toLowerCase() === key
  );
}
