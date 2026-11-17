import { createFileRoute, Outlet } from "@tanstack/react-router";
import { SettingsLayout } from "@/features/settings/shell";
import { Toaster } from "@/primitives/toaster";

export const Route = createFileRoute("/_app/settings")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <SettingsLayout>
      <Outlet />
      <Toaster position="bottom-right" />
    </SettingsLayout>
  );
}
