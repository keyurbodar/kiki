import { createFileRoute } from "@tanstack/react-router";
import { AutomationEditorPage } from "@/features/automations/automation-editor";

export const Route = createFileRoute("/_app/automation/$automationId")({
  component: RouteComponent,
});

function RouteComponent() {
  const { automationId } = Route.useParams();
  return <AutomationEditorPage automationId={automationId} />;
}
