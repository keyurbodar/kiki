import { createFileRoute } from "@tanstack/react-router";
import { OnboardingPage } from "@/features/onboarding/onboarding";
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
  return <OnboardingPage search={Route.useSearch()} />;
}
