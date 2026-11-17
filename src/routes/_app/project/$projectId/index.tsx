import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/project/$projectId/")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/settings/projects/$projectId",
      params: { projectId: params.projectId },
    });
  },
});
