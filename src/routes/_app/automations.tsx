import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
import { pageTitle } from "@/lib/page-title";

export const Route = createFileRoute("/_app/automations")({
  head: () => ({ meta: [{ title: pageTitle("Automations") }] }),
  component: lazyRouteComponent(
    () => import("@/features/automations/automations-page"),
    "AutomationsPage",
  ),
});
