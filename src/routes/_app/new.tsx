import { createFileRoute } from "@tanstack/react-router";
import { AppSidebar } from "@/components/app-sidebar";
import { RoutePlaceholder } from "@/components/route-placeholder";
import {
  MobileNavigationProvider,
  MobileNewThread,
  MobileShell,
  useIsNarrow,
} from "@/features/mobile";
import { searchParams } from "@/lib/search-params";

export const Route = createFileRoute("/_app/new")({
  validateSearch: searchParams(["prompt"]),
  component: RouteComponent,
});

function RouteComponent() {
  const isNarrow = useIsNarrow();
  if (isNarrow)
    return (
      <MobileNavigationProvider>
        <MobileShell sidebar={<AppSidebar />}>
          <MobileNewThread />
        </MobileShell>
      </MobileNavigationProvider>
    );
  return <RoutePlaceholder title="Capy" path="/new" />;
}
