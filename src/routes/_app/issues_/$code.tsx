import { createFileRoute } from "@tanstack/react-router";
import { IssuePage } from "@/features/issues/issue-page";

export const Route = createFileRoute("/_app/issues_/$code")({
  component: RouteComponent,
});

function RouteComponent() {
  const { code } = Route.useParams();
  return <IssuePage key={code} code={code} />;
}
