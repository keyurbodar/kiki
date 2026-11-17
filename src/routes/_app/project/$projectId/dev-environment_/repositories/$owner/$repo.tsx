import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_app/project/$projectId/dev-environment_/repositories/$owner/$repo",
)({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/settings/projects/$projectId/dev-environment/repositories/$owner/$repo",
      params: {
        projectId: params.projectId,
        owner: params.owner,
        repo: params.repo,
      },
    });
  },
});
