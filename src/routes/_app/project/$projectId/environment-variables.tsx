import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_app/project/$projectId/environment-variables",
)({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/settings/projects/$projectId/environment-variables",
      params: { projectId: params.projectId },
    });
  },
});
