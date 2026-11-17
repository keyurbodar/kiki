import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_app/project/$projectId/thread/$threadId",
)({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/thread/$threadId",
      params: { threadId: params.threadId },
    });
  },
});
