import { createFileRoute, Outlet } from "@tanstack/react-router";
import { MobileSettingsSheet } from "@/features/mobile/settings";
import { SettingsLayout } from "@/features/settings/shell";

export const Route = createFileRoute("/_app/settings")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <SettingsLayout MobileSheet={MobileSettingsSheet}>
      <Outlet />
    </SettingsLayout>
  );
}
