import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/settings/environment-variables")({
  beforeLoad: () => {
    throw redirect({ to: "/settings/projects" });
  },
});
