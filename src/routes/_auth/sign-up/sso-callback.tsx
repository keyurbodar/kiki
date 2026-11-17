import { createFileRoute } from "@tanstack/react-router";
import { SsoCallbackPage } from "@/features/auth/sso-callback";
import { searchParams } from "@/lib/search-params";

export const Route = createFileRoute("/_auth/sign-up/sso-callback")({
  validateSearch: searchParams(["redirect_url"]),
  component: RouteComponent,
});

function RouteComponent() {
  const { redirect_url } = Route.useSearch();
  return <SsoCallbackPage redirectUrl={redirect_url} />;
}
