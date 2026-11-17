import { createFileRoute } from "@tanstack/react-router";
import { SecurityPage } from "@/features/settings/security-page";
import { searchParams } from "@/lib/search-params";

export const Route = createFileRoute("/_app/settings/security")({
  validateSearch: searchParams(["passkey"]),
  component: RouteComponent,
});

function RouteComponent() {
  return <SecurityPage />;
}
