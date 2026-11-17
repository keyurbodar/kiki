import type { SettingsNavEntry } from "../registry";

export const entry: SettingsNavEntry = {
  id: "notifications-slack",
  label: "Slack",
  title: "Slack notifications",
  to: "/settings/notifications/slack",
  section: "search",
  order: 90,
  icon: "bell",
  keywords: "notifications slack dm direct message",
  rows: [
    {
      id: "slack-notify-enabled",
      title: "Slack direct messages",
      keywords: "dm bot enable",
    },
    {
      id: "slack-notify-mention",
      title: "Mentions",
      keywords: "slack notify mention tagged",
    },
    {
      id: "slack-notify-error",
      title: "Failed",
      keywords: "slack notify error crashed",
    },
    {
      id: "slack-notify-pr-merged",
      title: "PR merged",
      keywords: "slack notify pull request merged",
    },
  ],
};
