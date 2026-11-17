import type { SettingsNavEntry } from "../registry";

export const entry: SettingsNavEntry = {
  id: "mcp",
  label: "MCP & plugins",
  to: "/settings/mcp",
  section: "personal",
  order: 130,
  icon: "plugin-1",
  keywords: "mcp server tools external model context protocol plugins skills",
  rows: [
    {
      id: "mcp-setup",
      title: "Set up with Capy",
      keywords: "thread agent help add server",
    },
    {
      id: "mcp-marketplace",
      title: "Explore the marketplace",
      to: "/settings/mcp/marketplace",
      keywords: "plugins catalog add install explore",
    },
    {
      id: "mcp-organization",
      title: "Plugins and MCP servers shared by your organization",
      keywords: "organization shared every member connected once",
    },
    {
      id: "mcp-member",
      title: "Plugins and MCP servers you connect yourself",
      keywords: "each member own account connect your account personal sign in",
    },
    {
      id: "mcp-yours",
      title: "Plugins and MCP servers you added",
      keywords: "personal only me own accounts added by you",
    },
  ],
};
