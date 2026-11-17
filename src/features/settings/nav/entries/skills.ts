import type { SettingsNavEntry } from "../registry";

export const entry: SettingsNavEntry = {
  id: "skills",
  label: "Skills",
  to: "/settings/skills",
  section: "agent",
  order: 200,
  icon: "sparkle",
  keywords: "skills skill.md drive custom commands workflows captain crew",
  rows: [
    {
      id: "skills-list",
      title: "Skills in Drive",
      keywords:
        "organization project personal captain new create delete description not loaded",
    },
  ],
};
