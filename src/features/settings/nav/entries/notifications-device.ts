import type { SettingsNavEntry } from "../registry";

export const entry: SettingsNavEntry = {
  id: "notifications-device",
  label: "This device",
  to: "/settings/notifications/device",
  section: "search",
  order: 80,
  icon: "bell",
  keywords: "notifications browser desktop kinds",
  rows: [
    {
      id: "notify-mention",
      title: "Mentions",
      keywords: "notify notification mention tagged",
    },
    {
      id: "notify-error",
      title: "Failed",
      keywords: "notify notification error crashed",
    },
  ],
};
