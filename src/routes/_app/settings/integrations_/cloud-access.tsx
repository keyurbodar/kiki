import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_app/settings/integrations_/cloud-access",
)({
  beforeLoad: () => {
    throw redirect({ to: "/settings/cloud-credentials" });
  },
});
