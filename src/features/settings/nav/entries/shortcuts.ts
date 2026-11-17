import type { SettingsNavEntry } from "../registry";

export const entry: SettingsNavEntry = {
  id: "shortcuts",
  label: "Shortcuts",
  to: "/settings/shortcuts",
  section: "personal",
  order: 100,
  icon: "keyboard-cable",
  keywords: "keyboard keybindings keys hotkeys",
  rows: [
    {
      id: "voice-shortcut-mode",
      title: "Voice input shortcut",
      keywords:
        "voice input dictation microphone mic push to talk hold toggle shortcut",
    },
  ],
};
