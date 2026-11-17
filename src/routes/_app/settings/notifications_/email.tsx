import { createFileRoute } from "@tanstack/react-router";
import { SettingsEmailPage } from "@/features/settings-notifications/email-page";
import { searchParams } from "@/lib/search-params";

export const Route = createFileRoute("/_app/settings/notifications_/email")({
  validateSearch: searchParams(["from"]),
  component: RouteComponent,
});

function RouteComponent() {
  const { from } = Route.useSearch();
  return <SettingsEmailPage from={from} />;
}
