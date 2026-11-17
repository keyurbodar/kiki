import type { SettingsNavEntry } from "../registry";

export const entry: SettingsNavEntry = {
  id: "git",
  label: "Git & pull requests",
  to: "/settings/git",
  section: "agent",
  order: 220,
  icon: "pull-request",
  keywords: "agent behavior git branch commit pull request review feedback",
  rows: [
    {
      id: "commit-author",
      title: "Commit author",
      keywords:
        "git identity user capy pull request author co-authored-by trailer desktop device",
    },
    {
      id: "commit-email",
      title: "Commit email",
      keywords: "git identity email address noreply",
    },
    {
      id: "sign-commits",
      title: "Signed commits",
      keywords: "git gpg signature verified key",
    },
    {
      id: "branch-prefix",
      title: "Branch prefix",
      keywords: "git branch naming",
    },
    {
      id: "pr-draft-default",
      title: "Open pull requests as",
      keywords: "github pull request draft ready review default",
    },
    {
      id: "pr-badge",
      title: "Open in Capy button",
      keywords: "github pull request badge button link open in capy",
    },
    {
      id: "human-feedback",
      title: "Human feedback",
      keywords: "github pull request review comment react listen ignore",
    },
    {
      id: "review-bot-feedback",
      title: "Review bot feedback",
      keywords: "github pull request review bot react listen ignore",
    },
    {
      id: "review-bots",
      title: "Bot list",
      keywords: "github bot allowlist author list",
    },
    {
      id: "merge-conflicts",
      title: "Conflict response",
      keywords: "github pull request conflict react listen ignore",
    },
    {
      id: "ci-results",
      title: "CI results",
      keywords: "github pull request checks ci react listen ignore",
    },
    {
      id: "merge-conflict-thread-age",
      title: "Merge-conflict max thread age",
      keywords: "github pull request conflict days wake inactivity",
    },
  ],
};
