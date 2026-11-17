import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/project/$projectId/volume/$scope")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/project/$projectId/drive/$scope",
      params: { projectId: params.projectId, scope: params.scope },
    });
  },
});
