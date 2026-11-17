import type { SettingsNavEntry } from "../registry";

export const entry: SettingsNavEntry = {
  id: "projects",
  label: "Projects & setup",
  to: "/settings/projects",
  section: "personal",
  order: 120,
  icon: "box-2",
  keywords: "project projects repositories repos",
  rows: [
    {
      id: "project-repositories",
      title: "Repositories",
      to: "/settings/projects",
      keywords: "repo repos add repository github clone",
    },
    {
      id: "project-setup-and-snapshot",
      title: "Setup & snapshot",
      to: "/settings/projects",
      keywords:
        "dev environment install scripts startup snapshots build machine size vm",
    },
    {
      id: "project-environment-variables",
      title: "Environment variables",
      to: "/settings/projects",
      keywords: "env vars secrets keys",
    },
    {
      id: "project-mcp",
      title: "MCP servers",
      to: "/settings/projects",
      keywords: "mcp tools model context protocol",
    },
    {
      id: "project-volume",
      title: "Capy Drive",
      to: "/settings/projects",
      keywords: "drive volume skills instructions files context",
    },
  ],
};
