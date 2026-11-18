import { createFileRoute, Outlet } from "@tanstack/react-router";
import { SettingsLayout } from "@/features/settings/shell";

export const Route = createFileRoute("/_app/settings")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <SettingsLayout>
      <Outlet />
    </SettingsLayout>
  );
}
