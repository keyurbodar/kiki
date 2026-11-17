import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/project/$projectId/mcp_/new")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/settings/projects/$projectId/mcp/new",
      params: { projectId: params.projectId },
    });
  },
});
