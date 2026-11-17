import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/settings/setup-and-snapshots")({
  beforeLoad: () => {
    throw redirect({ to: "/settings/projects" });
  },
});
