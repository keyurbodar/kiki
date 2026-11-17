import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_app/project/$projectId/dev-environment",
)({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/settings/projects/$projectId/dev-environment",
      params: { projectId: params.projectId },
    });
  },
});
