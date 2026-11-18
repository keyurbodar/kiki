import { createRootRoute, HeadContent, Outlet } from "@tanstack/react-router";
import { AppCrashSurface } from "@/components/crash-surface";
import { DesktopQuitDialog } from "@/components/desktop-quit-dialog";
import { NotFoundPage } from "@/components/not-found-page";
import { DesktopReverificationDialog } from "@/features/desktop/desktop-reverification-dialog";
import { useSystemColorMode } from "@/features/shell/color-mode";

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: RootNotFound,
  errorComponent: AppCrashSurface,
});

function RootLayout() {
  useSystemColorMode();
  return (
    <div className="flex min-h-dvh bg-background text-foreground antialiased">
      <HeadContent />
      <Outlet />
      <DesktopQuitDialog />
      <DesktopReverificationDialog />
    </div>
  );
}

function RootNotFound() {
  return <NotFoundPage />;
}
