import { createFileRoute } from "@tanstack/react-router";
import { OrgBillingPage } from "@/features/settings-org/org-billing-page";

export const Route = createFileRoute("/_app/settings/org/billing")({
  component: OrgBillingPage,
});
