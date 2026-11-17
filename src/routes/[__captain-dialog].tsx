import { createFileRoute, notFound } from "@tanstack/react-router";
import { useLayoutEffect } from "react";
import { CaptainDialog } from "@/features/captains/dialogs";
import { applyColorMode, type ColorMode } from "@/tokens/theme";

type Search = { mode: ColorMode };

export const Route = createFileRoute("/__captain-dialog")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    mode:
      search.mode === "light" || search.mode === "dark"
        ? search.mode
        : "system",
  }),
  beforeLoad: () => {
    if (!import.meta.env.DEV) throw notFound();
  },
  component: CaptainDialogHarness,
});

function CaptainDialogHarness() {
  const { mode } = Route.useSearch();
  useLayoutEffect(() => applyColorMode(mode), [mode]);
  return <CaptainDialog request={{ kind: "create" }} onClose={() => {}} />;
}
