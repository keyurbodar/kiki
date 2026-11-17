import { createFileRoute } from "@tanstack/react-router";
import { DrivePage } from "@/features/drive/drive-page";
import { MobileDrive } from "@/features/mobile/lists/drive";
import { useIsNarrow } from "@/features/mobile/use-mobile";

export const Route = createFileRoute("/_app/drive")({
  component: RouteComponent,
});

function RouteComponent() {
  const isNarrow = useIsNarrow();
  if (isNarrow) return <MobileDrive />;
  return <DrivePage />;
}
