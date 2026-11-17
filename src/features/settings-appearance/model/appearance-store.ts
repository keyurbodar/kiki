import { useSyncExternalStore } from "react";
import {
  applyColorMode,
  COLOR_THEME_LABELS,
  type ColorMode,
  isPresetColorTheme,
  type PresetColorTheme,
  resolveColorMode,
} from "@/tokens/theme";
import { type ThemeColors, themeCss } from "./palette";

export type BackgroundEffect = "none" | "dither" | "grain" | "vignette";

export const BACKGROUND_EFFECT_LABELS: Record<BackgroundEffect, string> = {
  none: "None",
  dither: "Dither",
  grain: "Grain",
  vignette: "Vignette",
};

export interface BackgroundAdjustments {
  readonly brightness: number;
  readonly blur: number;
  readonly opacity: number;
  readonly fade: number;
  readonly overlay: number;
  readonly inputOpacity: number;
}

export const DEFAULT_BACKGROUND_ADJUSTMENTS: BackgroundAdjustments = {
  brightness: 100,
  blur: 0,
  fade: 100,
  opacity: 100,
  overlay: 0,
  inputOpacity: 100,
};

export interface DashboardBackground {
  readonly name: string;
  readonly url: string;
  readonly appearance: BackgroundAdjustments;
}

export type CodeFontSize = "default" | "11" | "12" | "13" | "14" | "15" | "16";
export type DiffStyle = "unified" | "split";
export type DiffColors = "red-green" | "blue-orange";
export type HiddenCategory = "tests" | "database" | "generated";
export type SyncMode = "synced" | "device";

export interface AppearancePreferences {
  readonly mode: ColorMode;
  readonly effect: BackgroundEffect;
  readonly background: DashboardBackground | null;
  readonly diffStyle: DiffStyle;
  readonly codeFontSize: CodeFontSize;
  readonly hidden: Readonly<Record<HiddenCategory, boolean>>;
}

export type ColorThemeSelection =
  | { readonly kind: "default" }
  | { readonly kind: "preset"; readonly id: PresetColorTheme }
  | ({
      readonly kind: "custom";
      readonly id: string;
      readonly name: string;
      readonly css: string;
    } & ThemeColors);

export interface AppearanceState {
  readonly preferences: AppearancePreferences;
  readonly syncMode: SyncMode;
  readonly colorTheme: ColorThemeSelection;
  readonly diffColors: DiffColors;
}

export const DEFAULT_PREFERENCES: AppearancePreferences = {
  mode: "system",
  effect: "dither",
  background: null,
  diffStyle: "unified",
  codeFontSize: "default",
  hidden: { tests: true, database: true, generated: true },
};

const APPEARANCE_KEY = "capy-web:appearance";
const COLOR_THEME_KEY = "capy-web:color-theme-v2";
const DIFF_COLORS_KEY = "capy-web:diff-colors";
const CUSTOM_THEME_STYLE_ID = "capy-custom-theme";
const CUSTOM_THEME_ATTR = "custom";

export const colorThemeLabel = (theme: ColorThemeSelection) =>
  theme.kind === "custom"
    ? theme.name
    : COLOR_THEME_LABELS[theme.kind === "preset" ? theme.id : "default"];

export const colorThemeKey = (theme: ColorThemeSelection) =>
  theme.kind === "default" ? "default" : `${theme.kind}:${theme.id}`;

const read = (key: string): unknown => {
  try {
    return JSON.parse(globalThis.localStorage?.getItem(key) ?? "null");
  } catch {
    return null;
  }
};

const write = (key: string, value: unknown) => {
  try {
    globalThis.localStorage?.setItem(key, JSON.stringify(value));
  } catch {}
};

const readColorTheme = (): ColorThemeSelection => {
  const value = read(COLOR_THEME_KEY) as ColorThemeSelection | null;
  if (value?.kind === "preset" && isPresetColorTheme(value.id)) return value;
  if (value?.kind === "custom" && typeof value.css === "string") return value;
  return { kind: "default" };
};

const readState = (): AppearanceState => {
  const stored = read(APPEARANCE_KEY) as {
    preferences?: Partial<AppearancePreferences>;
    syncMode?: SyncMode;
  } | null;
  return {
    preferences: { ...DEFAULT_PREFERENCES, ...stored?.preferences },
    syncMode: stored?.syncMode === "device" ? "device" : "synced",
    colorTheme: readColorTheme(),
    diffColors:
      read(DIFF_COLORS_KEY) === "blue-orange" ? "blue-orange" : "red-green",
  };
};

export function applyAppearance(
  state: AppearanceState,
  root: HTMLElement = document.documentElement,
) {
  applyColorMode(state.preferences.mode, root);
  root.style.colorScheme = resolveColorMode(state.preferences.mode);
  const theme = state.colorTheme;
  const existing = document.getElementById(CUSTOM_THEME_STYLE_ID);
  if (theme.kind === "custom") {
    const style = existing ?? document.createElement("style");
    style.id = CUSTOM_THEME_STYLE_ID;
    style.textContent = theme.css;
    if (!existing) document.head.appendChild(style);
    root.dataset.colorTheme = CUSTOM_THEME_ATTR;
  } else {
    existing?.remove();
    if (theme.kind === "preset") root.dataset.colorTheme = theme.id;
    else delete root.dataset.colorTheme;
  }
  if (state.diffColors === "blue-orange") root.dataset.diffColors = "blue-orange";
  else delete root.dataset.diffColors;
}

let state: AppearanceState | undefined;
const listeners = new Set<() => void>();

export const getAppearance = (): AppearanceState => {
  state ??= readState();
  return state;
};

const commit = (next: AppearanceState) => {
  state = next;
  write(APPEARANCE_KEY, {
    preferences: next.preferences,
    syncMode: next.syncMode,
  });
  write(COLOR_THEME_KEY, next.colorTheme);
  write(DIFF_COLORS_KEY, next.diffColors);
  if (typeof document !== "undefined") applyAppearance(next);
  for (const listener of listeners) listener();
};

export const appearanceActions = {
  updatePreferences: (patch: Partial<AppearancePreferences>) =>
    commit({
      ...getAppearance(),
      preferences: { ...getAppearance().preferences, ...patch },
    }),
  setSyncMode: (syncMode: SyncMode) => commit({ ...getAppearance(), syncMode }),
  setDiffColors: (diffColors: DiffColors) =>
    commit({ ...getAppearance(), diffColors }),
  selectColorTheme: (
    theme:
      | { readonly kind: "default" }
      | { readonly kind: "preset"; readonly id: PresetColorTheme }
      | ({ readonly kind: "custom"; readonly id: string; readonly name: string } & ThemeColors),
  ) =>
    commit({
      ...getAppearance(),
      colorTheme:
        theme.kind === "custom"
          ? { ...theme, css: themeCss(CUSTOM_THEME_ATTR, theme) }
          : theme,
    }),
  reset: () => {
    state = undefined;
    for (const listener of listeners) listener();
  },
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  const media = globalThis.matchMedia?.("(prefers-color-scheme: dark)");
  const onSystemChange = () => {
    if (getAppearance().preferences.mode === "system") {
      applyAppearance(getAppearance());
      listener();
    }
  };
  media?.addEventListener("change", onSystemChange);
  return () => {
    listeners.delete(listener);
    media?.removeEventListener("change", onSystemChange);
  };
};

export const useAppearance = () =>
  useSyncExternalStore(subscribe, getAppearance, getAppearance);

export const useResolvedMode = () =>
  resolveColorMode(useAppearance().preferences.mode);
