import { createRootRoute, Outlet } from "@tanstack/react-router";
import { useSystemColorMode } from "@/features/shell/color-mode";

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  useSystemColorMode();
  return (
    <div className="flex min-h-dvh bg-background text-foreground antialiased">
      <Outlet />
    </div>
  );
}
