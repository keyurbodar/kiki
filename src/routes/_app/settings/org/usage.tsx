import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

const loadOrgUsagePage = () => import("@/features/settings-org/org-usage-page");

/** The usage page is the only place recharts is drawn, and nothing else on the
 * settings tree needs it, so the page loads when the route opens. Warming it
 * from the loader is what lets `defaultPreload: "intent"` fetch it on hover. */
export const Route = createFileRoute("/_app/settings/org/usage")({
  loader: loadOrgUsagePage,
  component: lazyRouteComponent(loadOrgUsagePage, "SettingsOrgUsagePage"),
});
