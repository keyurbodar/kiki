import type { SettingsNavEntry } from "../registry";

export const entry: SettingsNavEntry = {
  id: "org-general",
  label: "General",
  title: "Organization",
  to: "/settings/org/general",
  section: "organization",
  order: 250,
  icon: "buildings",
  rows: [
    {
      id: "org-logo",
      title: "Logo",
      keywords: "workspace avatar",
    },
    {
      id: "org-name",
      title: "Name",
      keywords: "workspace rename",
    },
    {
      id: "org-id",
      title: "Organization ID",
      keywords: "identifier support copy",
    },
    {
      id: "org-issue-prefix",
      title: "Issue prefix",
      keywords: "issues code key letters",
    },
    {
      id: "my-default-visibility",
      title: "My default for new threads and Captains",
      keywords:
        "sharing visibility private access default only specific people",
    },
    {
      id: "org-default-visibility",
      title: "New work starts as",
      keywords:
        "sharing visibility private access default organization everyone",
    },
    {
      id: "org-private-work",
      title: "Private work",
      keywords:
        "sharing private threads captains projects grant personal threads access",
    },
    {
      id: "delete-organization",
      title: "Delete organization",
      keywords: "danger remove permanently",
    },
  ],
};
