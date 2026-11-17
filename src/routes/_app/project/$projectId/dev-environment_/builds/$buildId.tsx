import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_app/project/$projectId/dev-environment_/builds/$buildId",
)({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/settings/projects/$projectId/dev-environment/builds/$buildId",
      params: { projectId: params.projectId, buildId: params.buildId },
    });
  },
});
