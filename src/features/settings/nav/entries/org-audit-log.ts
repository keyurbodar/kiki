import type { SettingsNavEntry } from "../registry";

export const entry: SettingsNavEntry = {
  id: "org-audit-log",
  label: "Audit log",
  to: "/settings/org/audit-log",
  section: "organization",
  order: 320,
  icon: "history",
  keywords:
    "audit events history who changed admin security trail organization",
  rows: [],
};
