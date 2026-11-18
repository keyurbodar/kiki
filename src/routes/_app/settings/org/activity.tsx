import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
import { validateActivitySearch } from "@/features/settings-org/org-activity-page/activity-range";

const loadOrgActivityPage = () =>
  import("@/features/settings-org/org-activity-page");

/** The activity page draws charts; load it with the route rather than with the
 * shell, and keep the search validator on its own light module. Warming it from
 * the loader is what lets `defaultPreload: "intent"` fetch it on hover. */
export const Route = createFileRoute("/_app/settings/org/activity")({
  validateSearch: validateActivitySearch,
  loader: loadOrgActivityPage,
  component: lazyRouteComponent(loadOrgActivityPage, "OrgActivityPage"),
});
