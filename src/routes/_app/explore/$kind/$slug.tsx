import { createFileRoute } from "@tanstack/react-router";
import {
  ListingDetailPage,
  NotListed,
  parseKindParam,
} from "@/features/explore/listing-detail";

export const Route = createFileRoute("/_app/explore/$kind/$slug")({
  component: RouteComponent,
});

function RouteComponent() {
  const { kind, slug } = Route.useParams();
  const parsed = parseKindParam(kind);
  if (parsed === undefined) return <NotListed failed={false} />;
  return (
    <ListingDetailPage key={`${parsed}:${slug}`} kind={parsed} slug={slug} />
  );
}
