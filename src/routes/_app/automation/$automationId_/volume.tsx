import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/automation/$automationId_/volume")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/automation/$automationId/drive",
      params: { automationId: params.automationId },
    });
  },
});
