import type { SettingsNavEntry } from "../registry";

export const entry: SettingsNavEntry = {
  id: "org-members",
  label: "Members",
  to: "/settings/org/members",
  section: "organization",
  order: 280,
  icon: "people",
  keywords: "people invite roles admin owner organization",
  rows: [],
};
