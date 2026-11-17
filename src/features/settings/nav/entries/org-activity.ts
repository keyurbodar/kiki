import type { SettingsNavEntry } from "../registry";

export const entry: SettingsNavEntry = {
  id: "org-activity",
  label: "Activity",
  to: "/settings/org/activity",
  section: "organization",
  order: 310,
  icon: "merged",
  keywords:
    "merged pull requests prs members repositories productivity organization",
  rows: [],
};
