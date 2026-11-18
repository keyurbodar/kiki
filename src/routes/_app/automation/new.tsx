import { createFileRoute } from "@tanstack/react-router";
import { NewAutomationPage } from "@/features/automations/new-automation-page";
import { pageTitle } from "@/lib/page-title";
import { searchParams } from "@/lib/search-params";

export const Route = createFileRoute("/_app/automation/new")({
  head: () => ({ meta: [{ title: pageTitle("New automation") }] }),
  validateSearch: searchParams(["template", "thread"]),
  component: RouteComponent,
});

function RouteComponent() {
  const { template, thread } = Route.useSearch();
  return <NewAutomationPage templateId={template} threadId={thread} />;
}
