import { createFileRoute } from "@tanstack/react-router";
import { PullPage } from "@/components/pull-view";
import { searchParams } from "@/lib/search-params";

export const Route = createFileRoute("/_app/pull/$owner/$repo/$prNumber")({
  validateSearch: searchParams(["chat", "org", "tab", "thread"]),
  component: RouteComponent,
});

function RouteComponent() {
  const { owner, repo, prNumber } = Route.useParams();
  const { tab, org } = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <PullPage
      owner={owner}
      repo={repo}
      prNumber={prNumber}
      tab={tab}
      org={org}
      onTabChange={(next) =>
        void navigate({
          search: (current) => ({
            ...current,
            tab: next === "overview" ? undefined : next,
          }),
          replace: true,
        })
      }
    />
  );
}
