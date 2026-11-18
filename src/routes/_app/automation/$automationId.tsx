import { createFileRoute } from "@tanstack/react-router";
import { AutomationEditorPage } from "@/features/automations/automation-editor";
import { pageTitle } from "@/lib/page-title";

export const Route = createFileRoute("/_app/automation/$automationId")({
  head: () => ({ meta: [{ title: pageTitle("Automation") }] }),
  component: RouteComponent,
});

function RouteComponent() {
  const { automationId } = Route.useParams();
  return <AutomationEditorPage automationId={automationId} />;
}
