import { createFileRoute, Outlet } from "@tanstack/react-router";
import { ExploreFrameProvider } from "@/features/explore/explore-frame";
import { ThemePreviewSlotContext } from "@/features/explore/theme-detail";
import { SpecimenApp } from "@/features/settings-appearance/theme-preview/specimen-app";

export const Route = createFileRoute("/_app/explore")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <ExploreFrameProvider>
      <ThemePreviewSlotContext.Provider value={SpecimenApp}>
        <Outlet />
      </ThemePreviewSlotContext.Provider>
    </ExploreFrameProvider>
  );
}
