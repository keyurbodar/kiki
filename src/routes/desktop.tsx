import { createFileRoute } from "@tanstack/react-router";
import {
  DesktopHandoffPage,
  desktopScheme,
  handoffTarget,
} from "@/features/desktop/desktop-handoff";

export const Route = createFileRoute("/desktop")({
  validateSearch: (search: Record<string, unknown>) => ({
    to: handoffTarget(search.to),
    scheme: desktopScheme(search.scheme),
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const { to, scheme } = Route.useSearch();
  return <DesktopHandoffPage to={to} scheme={scheme} />;
}
