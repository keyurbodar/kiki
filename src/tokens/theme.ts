export const COLOR_THEME_IDS = [
  "absolutely",
  "bearded-oled",
  "catppuccin",
  "codex",
  "crimson-evernight",
  "everforest",
  "firecrawl",
  "github",
  "gruvbox",
  "hub",
  "linear",
  "notion",
  "one",
] as const;

export type PresetColorTheme = (typeof COLOR_THEME_IDS)[number];
export type ColorTheme = "default" | PresetColorTheme;
export type ColorMode = "system" | "light" | "dark";

export const COLOR_THEMES: readonly ColorTheme[] = [
  "default",
  ...COLOR_THEME_IDS,
];

export const COLOR_THEME_LABELS: Record<ColorTheme, string> = {
  default: "Capy",
  absolutely: "Absolutely",
  "bearded-oled": "OLED",
  catppuccin: "Catppuccin",
  codex: "Codex",
  "crimson-evernight": "Evernight",
  everforest: "Everforest",
  firecrawl: "Firecrawl",
  github: "GitHub",
  gruvbox: "Gruvbox",
  hub: "Hub",
  linear: "Linear",
  notion: "Notion",
  one: "One",
};

export const DEFAULT_COLOR_THEME: ColorTheme = "default";
export const DEFAULT_COLOR_MODE: ColorMode = "system";

const DARK_QUERY = "(prefers-color-scheme: dark)";

export const isPresetColorTheme = (value: string): value is PresetColorTheme =>
  (COLOR_THEME_IDS as readonly string[]).includes(value);

export const resolveColorMode = (mode: ColorMode): "light" | "dark" => {
  if (mode !== "system") return mode;
  return window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
};

export function applyColorTheme(
  theme: ColorTheme,
  root: HTMLElement = document.documentElement,
) {
  if (theme === "default") {
    delete root.dataset.colorTheme;
    return;
  }
  root.dataset.colorTheme = theme;
}

export function applyColorMode(
  mode: ColorMode,
  root: HTMLElement = document.documentElement,
) {
  root.classList.toggle("dark", resolveColorMode(mode) === "dark");
}
