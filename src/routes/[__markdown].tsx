import { createFileRoute, notFound } from "@tanstack/react-router";
import { useLayoutEffect } from "react";
import { MarkdownPartsPreview } from "@/components/markdown/preview";
import { applyColorMode, type ColorMode } from "@/tokens/theme";

type Search = { mode: ColorMode };

export const Route = createFileRoute("/__markdown")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    mode:
      search.mode === "light" || search.mode === "dark"
        ? search.mode
        : "system",
  }),
  beforeLoad: () => {
    if (!import.meta.env.DEV) throw notFound();
  },
  component: MarkdownHarness,
});

function MarkdownHarness() {
  const { mode } = Route.useSearch();
  useLayoutEffect(() => applyColorMode(mode), [mode]);
  return <MarkdownPartsPreview />;
}
