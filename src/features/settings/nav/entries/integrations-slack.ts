import type { SettingsNavEntry } from "../registry";

export const entry: SettingsNavEntry = {
  id: "integrations-slack",
  label: "Slack",
  to: "/settings/integrations/slack",
  section: "search",
  order: 180,
  icon: "slack",
  rows: [
    {
      id: "slack-default-project",
      title: "Default project",
      keywords: "slack routing",
    },
    {
      id: "slack-channel-projects",
      title: "Channel projects",
      keywords: "slack channel default project mapping routing",
    },
    {
      id: "slack-default-prompt",
      title: "Offer to save a default project",
      keywords: "slack default project prompt ask again",
    },
    {
      id: "slack-muted",
      title: "Mute new threads by default",
      keywords: "slack muted",
    },
    {
      id: "slack-confirmations",
      title: "Post confirmations",
      keywords:
        "slack stop archive unlink sync paused confirmation reply quiet",
    },
    {
      id: "slack-thread-links",
      title: "Link to the Capy thread",
      keywords: "slack arrow back link thread url footer post message quiet",
    },
    {
      id: "slack-aside-prefix",
      title: "Aside prefix",
      keywords: "slack ignore",
    },
    {
      id: "slack-model",
      title: "Default model",
      keywords: "slack default model mentions dm default-model follow web",
    },
    {
      id: "slack-pr-links",
      title: "Pull request links",
      keywords: "slack pull request pr link destination capy github",
    },
    {
      id: "slack-quiet-automations",
      title: "Quiet automation posts",
      keywords:
        "slack automation sent by footer mention ping status card quiet",
    },
  ],
};
