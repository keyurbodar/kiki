import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/volumes")({
  beforeLoad: () => {
    throw redirect({ to: "/drive" });
  },
});
