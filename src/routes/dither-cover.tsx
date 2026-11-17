import { createFileRoute } from "@tanstack/react-router";
import { RoutePlaceholder } from "@/components/route-placeholder";
import { searchParams } from "@/lib/search-params";

export const Route = createFileRoute("/dither-cover")({
  validateSearch: searchParams([
    "at",
    "code",
    "error",
    "linear",
    "message",
    "slack",
    "stage",
    "state",
    "theme",
  ]),
  component: RouteComponent,
});

function RouteComponent() {
  return <RoutePlaceholder title="Dither cover" path="/dither-cover" />;
}
