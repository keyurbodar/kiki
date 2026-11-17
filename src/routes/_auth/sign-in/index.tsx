import { createFileRoute } from "@tanstack/react-router";
import { SignInPage } from "@/features/auth/sign-in";
import { searchParams } from "@/lib/search-params";

export const Route = createFileRoute("/_auth/sign-in/")({
  validateSearch: searchParams([
    "continue",
    "email",
    "passkey",
    "ticket",
    "redirect_url",
  ]),
  component: RouteComponent,
});

function RouteComponent() {
  const search = Route.useSearch();
  return (
    <SignInPage
      key={search.continue}
      prefillEmail={search.email}
      redirectUrl={search.redirect_url}
      ticket={search.ticket}
      initialStep={search.continue}
      passkeyIntent={search.passkey}
    />
  );
}
