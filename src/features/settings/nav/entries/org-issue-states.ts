import type { SettingsNavEntry } from "../registry";

export const entry: SettingsNavEntry = {
  id: "org-issue-states",
  label: "Issue states",
  to: "/settings/org/issue-states",
  section: "organization",
  order: 270,
  icon: "circle-half-fill",
  keywords:
    "issues status statuses workflow open closed default reorder labels tags",
  rows: [],
};
