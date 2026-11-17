import type { SettingsNavEntry } from "../registry";

export const entry: SettingsNavEntry = {
  id: "instructions",
  label: "Instructions",
  to: "/settings/instructions",
  section: "agent",
  order: 190,
  icon: "page-text",
  keywords:
    "instructions agents.md claude.md crew.md rules prompt context drive custom user",
  rows: [
    {
      id: "instructions-files",
      title: "Files",
      keywords:
        "organization project personal captain crew agents.md edit write",
    },
    {
      id: "instructions-preview",
      title: "Loaded before the first message",
      keywords:
        "context window tokens budget truncated loaded skills repositories preview",
    },
  ],
};
