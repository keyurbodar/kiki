import { createFileRoute } from "@tanstack/react-router";
import { RoutePlaceholder } from "@/components/route-placeholder";

export const Route = createFileRoute(
  "/_app/settings/cloud-credentials_/aws_/$targetId",
)({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <RoutePlaceholder
      title="/settings/cloud-credentials/aws/$targetId"
      path="/settings/cloud-credentials/aws/$targetId"
    />
  );
}
