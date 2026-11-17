import { createFileRoute } from "@tanstack/react-router";
import { VerifyEmailPage } from "@/features/auth/verify-email";
import { searchParams } from "@/lib/search-params";

export const Route = createFileRoute("/_auth/sign-up/verify")({
  validateSearch: searchParams(["status"]),
  component: RouteComponent,
});

function RouteComponent() {
  const { status } = Route.useSearch();
  return <VerifyEmailPage status={status} returnTo="/sign-up" />;
}
