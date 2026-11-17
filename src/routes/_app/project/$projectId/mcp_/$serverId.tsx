import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/project/$projectId/mcp_/$serverId")(
  {
    beforeLoad: ({ params }) => {
      throw redirect({
        to: "/settings/projects/$projectId/mcp/$serverId",
        params: { projectId: params.projectId, serverId: params.serverId },
      });
    },
  },
);
