import { createFileRoute } from "@tanstack/react-router";
import { SignUpPage } from "@/features/auth/sign-up";
import { searchParams } from "@/lib/search-params";

export const Route = createFileRoute("/_auth/sign-up/")({
  validateSearch: searchParams(["continue", "email", "redirect_url"]),
  component: RouteComponent,
});

function RouteComponent() {
  const search = Route.useSearch();
  return (
    <SignUpPage
      key={search.continue}
      prefillEmail={search.email}
      redirectUrl={search.redirect_url}
      initialStep={search.continue}
    />
  );
}
