import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/project/$projectId/jam/$jamId")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/thread/$threadId",
      params: { threadId: params.jamId },
    });
  },
});
