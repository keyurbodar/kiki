import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_app/project/$projectId/pull/$owner/$repo/$prNumber",
)({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/pull/$owner/$repo/$prNumber",
      params: {
        owner: params.owner,
        repo: params.repo,
        prNumber: params.prNumber,
      },
    });
  },
});
