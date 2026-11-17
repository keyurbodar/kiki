import { createFileRoute, Outlet } from "@tanstack/react-router";
import { ExploreFrameProvider } from "@/features/explore/explore-frame";

export const Route = createFileRoute("/_app/explore")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <ExploreFrameProvider>
      <Outlet />
    </ExploreFrameProvider>
  );
}
