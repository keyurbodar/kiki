import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "@/features/home/home-page";
import { MobileNewThread, useIsPhoneSurface } from "@/features/mobile";
import { searchParams } from "@/lib/search-params";

export const Route = createFileRoute("/_app/new")({
  validateSearch: searchParams(["prompt"]),
  component: RouteComponent,
});

function RouteComponent() {
  const isPhoneSurface = useIsPhoneSurface();
  const { prompt } = Route.useSearch();
  if (isPhoneSurface) return <MobileNewThread />;
  return <HomePage prompt={prompt} />;
}
