import { createFileRoute } from "@tanstack/react-router";
import {
  OrgActivityPage,
  validateActivitySearch,
} from "@/features/settings-org/org-activity-page";

export const Route = createFileRoute("/_app/settings/org/activity")({
  validateSearch: validateActivitySearch,
  component: OrgActivityPage,
});
