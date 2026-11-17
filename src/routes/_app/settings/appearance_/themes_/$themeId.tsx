import { createFileRoute } from "@tanstack/react-router";
import { RoutePlaceholder } from "@/components/route-placeholder";

export const Route = createFileRoute(
  "/_app/settings/appearance_/themes_/$themeId",
)({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <RoutePlaceholder
      title="/settings/appearance/themes/$themeId"
      path="/settings/appearance/themes/$themeId"
    />
  );
}
