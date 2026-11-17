import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_app/settings/integrations_/mcp_/$serverId",
)({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/settings/mcp/$serverId",
      params: { serverId: params.serverId },
    });
  },
});
