import { createFileRoute, Outlet } from "@tanstack/react-router";
import { CrashSurface } from "@/components/crash-surface";
import { NotFoundPage } from "@/components/not-found-page";
import { CommandPaletteHost } from "@/features/command-palette";
import { AppLayout } from "@/features/shell/app-layout";

export const Route = createFileRoute("/_app")({
  component: AppRoute,
  errorComponent: AppError,
  notFoundComponent: AppNotFound,
});

function AppRoute() {
  return (
    <AppLayout>
      <Outlet />
      <CommandPaletteHost />
    </AppLayout>
  );
}

function AppError() {
  return <CrashSurface />;
}

function AppNotFound() {
  return <NotFoundPage />;
}
