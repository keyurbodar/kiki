import { createFileRoute, redirect } from "@tanstack/react-router";
import { MemoryPage } from "@/features/memory/memory-page";
import { searchParams } from "@/lib/search-params";

// Capy's memory experiment is paused; /memory falls back to the thread list.
const memoryFeaturePaused = () => true;

export const Route = createFileRoute("/_app/memory")({
  beforeLoad: () => {
    if (memoryFeaturePaused())
      throw redirect({ to: "/threads", replace: true });
  },
  validateSearch: searchParams(["file", "volume", "where", "who"]),
  component: RouteComponent,
});

function RouteComponent() {
  const search = Route.useSearch();
  return <MemoryPage search={search} />;
}
