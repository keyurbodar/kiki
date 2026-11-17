import { createFileRoute } from "@tanstack/react-router";
import { ReferralsPage } from "@/features/settings/referrals-page";

export const Route = createFileRoute("/_app/settings/referrals")({
  component: RouteComponent,
});

function RouteComponent() {
  return <ReferralsPage />;
}
