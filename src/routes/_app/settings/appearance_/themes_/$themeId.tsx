import { createFileRoute } from "@tanstack/react-router";
import { PublishThemePage } from "@/features/settings-appearance/theme-publish";

export const Route = createFileRoute(
  "/_app/settings/appearance_/themes_/$themeId",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { themeId } = Route.useParams();
  return <PublishThemePage themeId={themeId} />;
}
