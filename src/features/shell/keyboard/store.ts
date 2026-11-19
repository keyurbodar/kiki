import { useMemo, useSyncExternalStore } from "react";
import { PREFERENCE_CHANGE_EVENT } from "@/features/settings/general-page/local-preference";
import {
  bindingGlyphs,
  type EffectiveBinding,
  effectiveBindings,
  type KeybindOverrides,
} from "@/features/settings/shortcuts-page/keybindings";

/** Where the Shortcuts page stores rebinds. The dispatcher reads the same key. */
export const KEYBINDS_KEY = "kiki:keybinds";

const isOverrides = (value: unknown): value is KeybindOverrides =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function subscribe(onChange: () => void) {
  const onPreference = (event: Event) => {
    if (
      event instanceof CustomEvent &&
      (event.detail as { key?: string } | null)?.key !== KEYBINDS_KEY
    )
      return;
    onChange();
  };
  window.addEventListener(PREFERENCE_CHANGE_EVENT, onPreference);
  window.addEventListener("storage", onPreference);
  return () => {
    window.removeEventListener(PREFERENCE_CHANGE_EVENT, onPreference);
    window.removeEventListener("storage", onPreference);
  };
}

function readStored(): string | null {
  try {
    return window.localStorage.getItem(KEYBINDS_KEY);
  } catch {
    return null;
  }
}

export function readOverrides(): KeybindOverrides {
  return parseOverrides(readStored());
}

/** Cached against the stored string, so a keydown does not re-parse the overrides. */
let cache: { raw: string | null; bindings: readonly EffectiveBinding[] } = {
  raw: null,
  bindings: effectiveBindings({}),
};

export function currentBindings(): readonly EffectiveBinding[] {
  const raw = readStored();
  if (raw !== cache.raw)
    cache = { raw, bindings: effectiveBindings(readOverrides()) };
  return cache.bindings;
}

function parseOverrides(raw: string | null): KeybindOverrides {
  if (raw === null) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    return isOverrides(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export function useKeybindings(): readonly EffectiveBinding[] {
  const raw = useSyncExternalStore(subscribe, readStored, () => null);
  return useMemo(() => effectiveBindings(parseOverrides(raw)), [raw]);
}

/**
 * The printed keys for a command, from the same table the dispatcher matches
 * against: a rebind changes the chip and the handler together.
 */
export function useShortcutGlyphs(command: string): string[] {
  const bindings = useKeybindings();
  const binding = bindings.find((row) => row.command === command)?.key;
  return binding === undefined ? [] : (bindingGlyphs(binding) ?? []);
}

/**
 * The glyphs as one printed chord: single keys run together (`⌘⇧O`), and
 * anything spelled out stays legible (`Mod+Shift+O`).
 */
export function glyphChord(glyphs: ReadonlyArray<string>): string | undefined {
  if (glyphs.length === 0) return undefined;
  return glyphs.some((glyph) => glyph.length > 1)
    ? glyphs.join("+")
    : glyphs.join("");
}

export function shortcutGlyphText(command: string): string | null {
  const binding = currentBindings().find((row) => row.command === command)?.key;
  const glyphs = binding === undefined ? null : bindingGlyphs(binding);
  return glyphs === null ? null : (glyphChord(glyphs) ?? null);
}

/** The chord a command prints beside its label, or nothing when it has none. */
export function useShortcutChord(command: string): string | undefined {
  return glyphChord(useShortcutGlyphs(command));
}
