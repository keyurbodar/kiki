import type { SettingsNavEntry } from "../registry";

export const entry: SettingsNavEntry = {
  id: "appearance",
  label: "Appearance",
  to: "/settings/appearance",
  section: "personal",
  order: 10,
  icon: "contrast",
  rows: [
    {
      id: "theme",
      title: "Mode",
      keywords: "appearance theme dark light system",
    },
    {
      id: "appearance-sync",
      title: "Appearance sync",
      keywords: "synced device local wallpaper effect accent",
    },
    {
      id: "color-theme",
      title: "Color theme",
      keywords:
        "save as custom palette accent background foreground tint absolutely oled bearded evernight crimson catppuccin mocha latte codex everforest firecrawl github gruvbox hub pornhub linear notion one",
    },
    {
      id: "home-background",
      title: "Dashboard background",
      keywords:
        "image gif wallpaper backdrop custom shader dither home screen brightness blur opacity fade overlay input",
    },
    {
      id: "background-effect",
      title: "Background effect",
      keywords: "wallpaper texture none dither grain noise vignette overlay",
    },
    {
      id: "code-font-size",
      title: "Code font size",
      keywords: "text zoom smaller larger editor file diff monospace",
    },
    {
      id: "diff-view",
      title: "Diff view",
      keywords: "unified split code changes",
    },
    {
      id: "diff-colors",
      title: "Diff colors",
      keywords: "colorblind accessible palette blue orange red green",
    },
    {
      id: "hidden-in-pull-requests",
      title: "Hidden in pull requests",
      keywords:
        "hide grey out line count tests specs fixtures database migrations schema snapshots generated lockfiles vendored hidden category",
    },
  ],
};
