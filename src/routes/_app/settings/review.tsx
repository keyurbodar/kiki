import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/settings/review")({
  beforeLoad: () => {
    throw redirect({ to: "/settings/review/repositories" });
  },
});
