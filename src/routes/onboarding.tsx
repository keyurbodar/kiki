import { createFileRoute } from "@tanstack/react-router";
import { RoutePlaceholder } from "@/components/route-placeholder";
import { searchParams } from "@/lib/search-params";

export const Route = createFileRoute("/onboarding")({
  validateSearch: searchParams([
    "avatar",
    "covered",
    "credentials",
    "fixture",
    "githubFixture",
    "history",
    "intent",
    "jamId",
    "machineId",
    "path",
  ]),
  component: RouteComponent,
});

function RouteComponent() {
  return <RoutePlaceholder title="Onboarding" path="/onboarding" />;
}
