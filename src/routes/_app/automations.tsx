import { createFileRoute } from "@tanstack/react-router";
import { AutomationsPage } from "@/features/automations/automations-page";
import { MobileAutomations } from "@/features/mobile/lists/automations";
import { useIsNarrow } from "@/features/mobile/use-mobile";

export const Route = createFileRoute("/_app/automations")({
  component: RouteComponent,
});

function RouteComponent() {
  const isNarrow = useIsNarrow();
  if (isNarrow) return <MobileAutomations />;
  return <AutomationsPage />;
}
