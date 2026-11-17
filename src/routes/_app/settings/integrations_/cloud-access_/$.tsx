import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_app/settings/integrations_/cloud-access_/$",
)({
  beforeLoad: ({ params }) => {
    throw redirect({
      href: `/settings/cloud-credentials/${params._splat ?? ""}`,
    });
  },
});
