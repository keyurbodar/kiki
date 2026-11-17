import type { SettingsNavEntry } from "../registry";

export const entry: SettingsNavEntry = {
  id: "api",
  label: "API",
  to: "/settings/api",
  section: "personal",
  order: 160,
  icon: "key-2",
  rows: [
    {
      id: "service-users",
      title: "Service users",
      keywords:
        "api token credential automation ci service account programmatic access",
    },
    {
      id: "public-api-keys",
      title: "API keys",
      keywords: "api token credential automation cli programmatic access",
    },
  ],
};
