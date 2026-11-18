import { createFileRoute, Outlet } from "@tanstack/react-router";
import { CrashSurface } from "@/components/crash-surface";
import { NotFoundPage } from "@/components/not-found-page";
import { CreateProjectDialogProvider } from "@/features/settings-projects/shared/create-project-dialog";
import { AppLayout } from "@/features/shell/app-layout";
import { Toaster } from "@/primitives/toaster";

export const Route = createFileRoute("/_app")({
  component: AppRoute,
  errorComponent: AppError,
  notFoundComponent: AppNotFound,
});

function AppRoute() {
  return (
    <CreateProjectDialogProvider>
      <AppLayout>
        <Outlet />
      </AppLayout>
      <Toaster />
    </CreateProjectDialogProvider>
  );
}

function AppError() {
  return <CrashSurface />;
}

function AppNotFound() {
  return <NotFoundPage />;
}
