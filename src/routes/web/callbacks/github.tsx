import { createFileRoute } from "@tanstack/react-router";
import { GitHubCallback } from "@/features/onboarding/callback-surface";
import { searchParams } from "@/lib/search-params";

export const Route = createFileRoute("/web/callbacks/github")({
  validateSearch: searchParams([
    "code",
    "error",
    "installation_id",
    "setup_action",
    "state",
  ]),
  component: RouteComponent,
});

function RouteComponent() {
  const search = Route.useSearch();
  return (
    <GitHubCallback
      input={{
        code: search.code,
        error: search.error,
        state: search.state,
        installationId: search.installation_id,
        setupAction: search.setup_action,
      }}
    />
  );
}
