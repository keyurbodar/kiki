import type { SettingsNavEntry } from "../registry";

export const entry: SettingsNavEntry = {
  id: "notifications",
  label: "Notifications",
  to: "/settings/notifications",
  section: "personal",
  order: 60,
  icon: "bell",
  keywords:
    "notify alert ring bell push done finished ready attention slack dm",
  rows: [
    {
      id: "system-notifications",
      title: "System notifications",
      keywords:
        "notify alert desktop native push done finished ready attention permission",
    },
    {
      id: "completion-sound",
      title: "Completion sound",
      keywords: "notify ding capybara chime audio custom sound upload mute",
    },
    {
      id: "custom-sound",
      title: "Custom sound",
      keywords: "upload clip audio file own mp3 wav replace remove",
    },
    {
      id: "test-notification",
      title: "Test notification",
      keywords: "send preview try ring",
    },
    {
      id: "subscribe-on-message",
      title: "Subscribe when you write",
      keywords:
        "subscribe follow sidebar auto first message thread captain ask always never",
    },
    {
      id: "channel-device",
      title: "This device",
      to: "/settings/notifications/device",
      keywords: "browser desktop app native push which kinds",
    },
    {
      id: "channel-slack",
      title: "Slack",
      to: "/settings/notifications/slack",
      keywords: "dm direct message bot push",
    },
    {
      id: "channel-email",
      title: "Email",
      to: "/settings/notifications/email",
      keywords: "email unsubscribe newsletter marketing recap",
    },
  ],
};
