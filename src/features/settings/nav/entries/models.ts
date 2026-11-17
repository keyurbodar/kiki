import type { SettingsNavEntry } from "../registry";

export const entry: SettingsNavEntry = {
  id: "models",
  label: "Models",
  to: "/settings/models",
  section: "personal",
  order: 110,
  icon: "chip",
  keywords: "served by subscriptions keys gateways organization default",
  rows: [
    {
      id: "model-defaults",
      title: "Default models",
      keywords:
        "default model web home composer slack linear api key new thread",
    },
    {
      id: "slack-default-model",
      title: "Slack default model",
      keywords: "slack default model mentions dm default-model follow web",
    },
    {
      id: "linear-default-model",
      title: "Linear default model",
      keywords: "linear default model issues follow web",
    },
    {
      id: "org-default-model",
      title: "Organization default model and effort",
      keywords:
        "org default model effort reasoning members service users fallback",
    },
    {
      id: "codex",
      title: "Codex",
      keywords: "openai subscription seat",
    },
    {
      id: "copilot",
      title: "GitHub Copilot",
      keywords: "subscription seat",
    },
    {
      id: "supergrok",
      title: "SuperGrok",
      keywords: "xai grok subscription",
    },
    {
      id: "claude",
      title: "Claude Code",
      keywords:
        "anthropic claude code agent pro max subscription setup token setup-token",
    },
    {
      id: "my-connections",
      title: "Your connections",
      keywords:
        "personal key api key subscription gateway openrouter order drag",
    },
    {
      id: "api-keys",
      title: "Organization connections",
      keywords:
        "byok bring your own key api keys anthropic openai openrouter openai-compatible gateway capy credits members organization",
    },
    {
      id: "members",
      title: "Members",
      keywords:
        "members own subscriptions keys allow choose organization admin",
    },
    {
      id: "credits-fallback",
      title: "When a subscription or key runs out",
      keywords:
        "capy credits fallback out of usage used up limit ask wait subscription key",
    },
    {
      id: "catalog",
      title: "Models",
      keywords:
        "catalog served by only this key turn off compact compaction context window tokens organization",
    },
  ],
};
