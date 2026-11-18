import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/automations")({
  component: lazyRouteComponent(
    () => import("@/features/automations/automations-page"),
    "AutomationsPage",
  ),
});
