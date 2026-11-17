import { createFileRoute } from "@tanstack/react-router";
import { RoutePlaceholder } from "@/components/route-placeholder";
import { MobileExplore } from "@/features/mobile/lists/explore";
import { useIsNarrow } from "@/features/mobile/use-mobile";
import { searchParams } from "@/lib/search-params";

export const Route = createFileRoute("/_app/explore/")({
  validateSearch: searchParams(["q"]),
  component: RouteComponent,
});

function RouteComponent() {
  const isNarrow = useIsNarrow();
  if (isNarrow) return <MobileExplore />;
  return <RoutePlaceholder title="Explore" path="/explore" />;
}
