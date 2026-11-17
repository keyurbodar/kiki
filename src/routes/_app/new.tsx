import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "@/features/home/home-page";
import { searchParams } from "@/lib/search-params";

export const Route = createFileRoute("/_app/new")({
  validateSearch: searchParams(["prompt"]),
  component: RouteComponent,
});

function RouteComponent() {
  const { prompt } = Route.useSearch();
  return <HomePage prompt={prompt} />;
}
