import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ExplorePage,
  exploreKindOf,
  parseExploreSearch,
} from "@/features/explore/explore-page";

export const Route = createFileRoute("/_app/explore/")({
  validateSearch: parseExploreSearch,
  component: RouteComponent,
});

function RouteComponent() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const kind = exploreKindOf(search);
  return (
    <ExplorePage
      kind={kind}
      search={search}
      onSearch={(next) =>
        void navigate({
          to: "/explore",
          search: { ...search, ...next },
          replace: next.q !== search.q,
          resetScroll: false,
        })
      }
    />
  );
}
