import { createFileRoute, Outlet } from "@tanstack/react-router";
import { MobileSettingsSheet } from "@/features/mobile/settings";
import { SettingsLayout } from "@/features/settings/shell";
import { Toaster } from "@/primitives/toaster";

export const Route = createFileRoute("/_app/settings")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <SettingsLayout MobileSheet={MobileSettingsSheet}>
      <Outlet />
      <Toaster position="bottom-right" />
    </SettingsLayout>
  );
}
