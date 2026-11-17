import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/settings/capy")({
  beforeLoad: () => {
    throw redirect({ to: "/settings/threads" });
  },
});
