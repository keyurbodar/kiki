import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

/** The usage page is the only place recharts is drawn, and nothing else on the
 * settings tree needs it, so the page loads when the route opens. */
export const Route = createFileRoute("/_app/settings/org/usage")({
  component: lazyRouteComponent(
    () => import("@/features/settings-org/org-usage-page"),
    "SettingsOrgUsagePage",
  ),
});
