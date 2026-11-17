import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import {
  exploreKindFromPath,
  parseExploreSearch,
} from "@/features/explore/explore-page";

export const Route = createFileRoute("/_app/explore/$kind/")({
  validateSearch: parseExploreSearch,
  beforeLoad: ({ params, search, location }) => {
    const kind = exploreKindFromPath(params.kind);
    if (kind === undefined) throw notFound();
    throw redirect({
      to: "/explore",
      search: { ...search, tab: kind === "plugin" ? undefined : kind },
      hash: location.hash,
      replace: true,
    });
  },
  component: RouteComponent,
});

function RouteComponent() {
  return null;
}
