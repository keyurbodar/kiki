import { createFileRoute, notFound } from "@tanstack/react-router";
import {
  ListingDetailPage,
  parseKindParam,
} from "@/features/explore/listing-detail";
import { ThemeListingPage } from "@/features/explore/theme-page";

export const Route = createFileRoute("/_app/explore/$kind/$slug")({
  beforeLoad: ({ params }) => {
    if (parseKindParam(params.kind) === undefined) throw notFound();
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { kind, slug } = Route.useParams();
  const listingKind = parseKindParam(kind);
  if (listingKind === undefined) return null;
  return listingKind === "theme" ? (
    <ThemeListingPage slug={slug} />
  ) : (
    <ListingDetailPage kind={listingKind} slug={slug} />
  );
}
