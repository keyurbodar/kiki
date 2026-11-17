import { createFileRoute } from "@tanstack/react-router";
import { RoutePlaceholder } from "@/components/route-placeholder";
import { MobileDrive } from "@/features/mobile/lists/drive";
import { useIsNarrow } from "@/features/mobile/use-mobile";

export const Route = createFileRoute("/_app/drive")({
  component: RouteComponent,
});

function RouteComponent() {
  const isNarrow = useIsNarrow();
  if (isNarrow) return <MobileDrive />;
  return <RoutePlaceholder title="Capy Drive" path="/drive" />;
}
