import { createFileRoute, notFound } from "@tanstack/react-router";
import { useLayoutEffect } from "react";
import { TooltipSpecimen } from "@/primitives/tooltip/tooltip.specimen";
import { applyColorMode, type ColorMode } from "@/tokens/theme";

type Search = { mode: ColorMode };

export const Route = createFileRoute("/__p08")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    mode:
      search.mode === "light" || search.mode === "dark"
        ? search.mode
        : "system",
  }),
  beforeLoad: () => {
    if (!import.meta.env.DEV) throw notFound();
  },
  component: TooltipHarness,
});

function TooltipHarness() {
  const { mode } = Route.useSearch();

  useLayoutEffect(() => {
    applyColorMode(mode);
  }, [mode]);

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <TooltipSpecimen />
    </div>
  );
}
