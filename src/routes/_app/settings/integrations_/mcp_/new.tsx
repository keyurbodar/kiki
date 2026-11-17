import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/settings/integrations_/mcp_/new")({
  beforeLoad: () => {
    throw redirect({ to: "/settings/mcp/new" });
  },
});
