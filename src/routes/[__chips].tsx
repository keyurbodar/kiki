import { createFileRoute, notFound } from "@tanstack/react-router";
import { useLayoutEffect } from "react";
import { ChipsPreview } from "@/components/markdown-chips/preview";
import { applyColorMode, type ColorMode } from "@/tokens/theme";

type Search = { mode: ColorMode };

export const Route = createFileRoute("/__chips")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    mode:
      search.mode === "light" || search.mode === "dark"
        ? search.mode
        : "system",
  }),
  beforeLoad: () => {
    if (!import.meta.env.DEV) throw notFound();
  },
  component: ChipsHarness,
});

function ChipsHarness() {
  const { mode } = Route.useSearch();
  useLayoutEffect(() => applyColorMode(mode), [mode]);
  return <ChipsPreview />;
}
