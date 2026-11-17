import { createRootRoute, Outlet } from "@tanstack/react-router";

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  return (
    <div className="min-h-dvh bg-white text-neutral-900 antialiased">
      <Outlet />
    </div>
  );
}
