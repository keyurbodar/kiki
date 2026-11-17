import type { SettingsNavEntry } from "../registry";

export const entry: SettingsNavEntry = {
  id: "review-agent-config",
  label: "Agent config",
  title: "Review agent config",
  to: "/settings/review/agent-config",
  section: "review",
  order: 240,
  icon: "settings-gear-1",
  keywords: "effort guides filters ignore paths instructions rules context",
  rows: [
    {
      id: "review-effort",
      title: "Review tiers",
      keywords:
        "tier level depth low medium high flex careful thorough quick cost mode",
    },
    {
      id: "review-guides",
      title: "Guides",
      keywords: "guided review pull request summary chapters guide tab",
    },
    {
      id: "review-filter-rules",
      title: "PR filters",
      keywords:
        "skip exclude label base branch title body keyword author dependabot rule filter",
    },
    {
      id: "review-ignore-paths",
      title: "Ignore paths",
      keywords: "ignore patterns files lockfile generated vendor gitignore",
    },
    {
      id: "review-rules",
      title: "Custom instructions",
      keywords:
        "rules files source review conventions instructions context paths globs scopes active inactive",
    },
  ],
};
