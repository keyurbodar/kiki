import { createFileRoute } from "@tanstack/react-router";
import { RoutePlaceholder } from "@/components/route-placeholder";
import { searchParams } from "@/lib/search-params";

export const Route = createFileRoute("/desktop")({
  validateSearch: searchParams(["scheme", "to"]),
  component: RouteComponent,
});

function RouteComponent() {
  return <RoutePlaceholder title="Open in desktop app" path="/desktop" />;
}
