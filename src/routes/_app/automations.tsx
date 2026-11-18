import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
import { pageTitle } from "@/lib/page-title";

/**
 * The page is its own chunk. Warming it from the loader lets
 * `defaultPreload: "intent"` fetch it on hover rather than on the click.
 */
const loadAutomationsPage = () =>
  import("@/features/automations/automations-page");

export const Route = createFileRoute("/_app/automations")({
  head: () => ({ meta: [{ title: pageTitle("Automations") }] }),
  loader: loadAutomationsPage,
  component: lazyRouteComponent(loadAutomationsPage, "AutomationsPage"),
});
