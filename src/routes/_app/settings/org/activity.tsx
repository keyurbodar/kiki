import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
import { validateActivitySearch } from "@/features/settings-org/org-activity-page/activity-range";

/** The activity page draws charts; load it with the route rather than with the
 * shell, and keep the search validator on its own light module. */
export const Route = createFileRoute("/_app/settings/org/activity")({
  validateSearch: validateActivitySearch,
  component: lazyRouteComponent(
    () => import("@/features/settings-org/org-activity-page"),
    "OrgActivityPage",
  ),
});
