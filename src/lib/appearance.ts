import { useEffect, useSyncExternalStore } from "react";
import {
  applyColorMode,
  applyColorTheme,
  COLOR_THEME_IDS,
  COLOR_THEME_LABELS,
  type ColorMode,
  isPresetColorTheme,
  type PresetColorTheme,
  resolveColorMode,
} from "@/tokens/theme";

export type ColorThemeChoice =
  | { kind: "default" }
  | { kind: "preset"; id: PresetColorTheme }
  | { kind: "custom"; id: string; name: string };

export const APPEARANCE_STORAGE_KEY = "capy-web:appearance";
export const COLOR_THEME_STORAGE_KEY = "capy-web:color-theme-v2";

export const PRESET_COLOR_THEME_CHOICES: readonly ColorThemeChoice[] = [
  { kind: "default" },
  ...COLOR_THEME_IDS.map((id) => ({ kind: "preset" as const, id })),
];

export const colorThemeKey = (theme: ColorThemeChoice) =>
  theme.kind === "default" ? "default" : `${theme.kind}:${theme.id}`;

export const colorThemeLabel = (theme: ColorThemeChoice) =>
  theme.kind === "custom"
    ? theme.name
    : COLOR_THEME_LABELS[theme.kind === "default" ? "default" : theme.id];

export const sameColorTheme = (a: ColorThemeChoice, b: ColorThemeChoice) =>
  colorThemeKey(a) === colorThemeKey(b);

const readJson = (key: string): unknown => {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "null");
  } catch {
    return null;
  }
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export function readColorMode(): ColorMode {
  const stored = readJson(APPEARANCE_STORAGE_KEY);
  const mode =
    isRecord(stored) && isRecord(stored.preferences)
      ? stored.preferences.mode
      : undefined;
  return mode === "light" || mode === "dark" ? mode : "system";
}

export function readColorTheme(): ColorThemeChoice {
  const stored = readJson(COLOR_THEME_STORAGE_KEY);
  if (!isRecord(stored) || typeof stored.id !== "string") {
    return { kind: "default" };
  }
  if (stored.kind === "preset" && isPresetColorTheme(stored.id)) {
    return { kind: "preset", id: stored.id };
  }
  if (stored.kind === "custom" && typeof stored.name === "string") {
    return { kind: "custom", id: stored.id, name: stored.name };
  }
  return { kind: "default" };
}

export type AppearanceState = {
  mode: ColorMode;
  resolvedMode: "light" | "dark";
  colorTheme: ColorThemeChoice;
  displayedColorTheme: ColorThemeChoice;
};

const listeners = new Set<() => void>();
let preview: ColorThemeChoice | null = null;
let state: AppearanceState | null = null;

function computeState(): AppearanceState {
  const mode = readColorMode();
  const colorTheme = readColorTheme();
  return {
    mode,
    resolvedMode: resolveColorMode(mode),
    colorTheme,
    displayedColorTheme: preview ?? colorTheme,
  };
}

function refresh() {
  const next = computeState();
  const root = document.documentElement;
  applyColorMode(next.mode, root);
  root.style.colorScheme = next.resolvedMode;
  applyColorTheme(
    next.displayedColorTheme.kind === "preset"
      ? next.displayedColorTheme.id
      : "default",
    root,
  );
  state = next;
  for (const listener of listeners) listener();
}

const getSnapshot = () => {
  state ??= computeState();
  return state;
};

function subscribe(listener: () => void) {
  listeners.add(listener);
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const onStorage = (event: StorageEvent) => {
    if (
      event.key === APPEARANCE_STORAGE_KEY ||
      event.key === COLOR_THEME_STORAGE_KEY
    ) {
      refresh();
    }
  };
  media.addEventListener("change", refresh);
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    media.removeEventListener("change", refresh);
    window.removeEventListener("storage", onStorage);
  };
}

export function setColorMode(mode: ColorMode) {
  const stored = readJson(APPEARANCE_STORAGE_KEY);
  const current = isRecord(stored) ? stored : {};
  const preferences = isRecord(current.preferences) ? current.preferences : {};
  localStorage.setItem(
    APPEARANCE_STORAGE_KEY,
    JSON.stringify({ ...current, preferences: { ...preferences, mode } }),
  );
  refresh();
}

export function setColorTheme(theme: ColorThemeChoice) {
  localStorage.setItem(COLOR_THEME_STORAGE_KEY, JSON.stringify(theme));
  refresh();
}

export function previewColorTheme(theme: ColorThemeChoice | null) {
  preview = theme;
  refresh();
}

export function useAppearance() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function useColorThemePreview() {
  useEffect(() => () => previewColorTheme(null), []);
  return {
    onOpenChange: (open: boolean) => {
      if (!open) previewColorTheme(null);
    },
    itemProps: (theme: ColorThemeChoice) => ({
      onPointerEnter: (event: { pointerType: string }) => {
        if (event.pointerType !== "touch") previewColorTheme(theme);
      },
      onPointerLeave: () => previewColorTheme(null),
    }),
  };
}
