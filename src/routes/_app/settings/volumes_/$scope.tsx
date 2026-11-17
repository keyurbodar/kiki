import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/settings/volumes_/$scope")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/drive/$scope", params: { scope: params.scope } });
  },
});
