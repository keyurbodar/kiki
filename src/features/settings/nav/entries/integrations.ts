import type { SettingsNavEntry } from "../registry";

export const entry: SettingsNavEntry = {
  id: "integrations",
  label: "Integrations",
  to: "/settings/integrations",
  section: "personal",
  order: 140,
  icon: "puzzle",
  rows: [
    {
      id: "github",
      title: "GitHub",
      to: "/settings/integrations/github",
      keywords: "git repository account installation",
    },
    {
      id: "slack",
      title: "Slack",
      to: "/settings/integrations/slack",
      keywords: "workspace threads mentions",
    },
    {
      id: "linear",
      title: "Linear",
      to: "/settings/integrations/linear",
      keywords: "issues delegate",
    },
    {
      id: "paper",
      title: "Paper",
      to: "/settings/integrations/paper",
      keywords: "design files canvas embed",
    },
    {
      id: "revyl",
      title: "Revyl",
      to: "/settings/integrations/revyl",
      keywords: "mobile revyl ios android devices simulator emulator",
    },
    {
      id: "tailscale",
      title: "Tailscale",
      to: "/settings/integrations/tailscale",
      keywords: "tailnet vpn network private services wireguard",
    },
  ],
};
