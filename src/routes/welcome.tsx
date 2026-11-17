import { createFileRoute } from "@tanstack/react-router";
import { WelcomePage } from "@/features/auth/welcome";
import { searchParams } from "@/lib/search-params";

export const Route = createFileRoute("/welcome")({
  validateSearch: searchParams(["email", "redirect_url"]),
  component: RouteComponent,
});

function RouteComponent() {
  const { redirect_url } = Route.useSearch();
  return <WelcomePage redirectUrl={redirect_url} />;
}
