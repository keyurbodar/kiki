import { createFileRoute, notFound } from "@tanstack/react-router";
import { useLayoutEffect } from "react";
import { Button } from "@/primitives/button";
import { toast } from "@/primitives/toaster";
import { applyColorMode, type ColorMode } from "@/tokens/theme";

/**
 * Every toast variant Capy renders, on one page, so the card can be driven and
 * measured: the six types, the description slot, the action row, and a stack of
 * five to check the collapsed offsets and the hover expansion. The toaster
 * itself comes from the root layout, so this page also proves that mount works.
 */

type Search = { mode: ColorMode };

export const Route = createFileRoute("/__toasts")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    mode:
      search.mode === "light" || search.mode === "dark"
        ? search.mode
        : "system",
  }),
  beforeLoad: () => {
    // Dev only, plus `vite build --mode harness`: the toast card's colour,
    // close control and stacking are checked on a production bundle too, and
    // a plain `vite build` must still 404 here.
    if (!import.meta.env.DEV && import.meta.env.MODE !== "harness")
      throw notFound();
  },
  component: ToastsHarness,
});

const forever = { duration: Number.POSITIVE_INFINITY };

const fire = {
  default: () => toast("Copied thread link", forever),
  success: () =>
    toast.success("Link copied", {
      description: "Fix missing x-opencode-session error",
      ...forever,
    }),
  error: () =>
    toast.error("Push rejected", {
      description: "The remote has commits you don't have yet.",
      ...forever,
    }),
  warning: () => toast.warning("Machine is low on memory", forever),
  info: () =>
    toast.info("Setup snapshot is building", {
      description: "New threads boot from it when it finishes.",
      ...forever,
    }),
  action: () =>
    toast("Branch pushed", {
      description: "Upstream moved while you were editing.",
      action: { label: "Open", onClick: () => {} },
      cancel: { label: "Dismiss" },
      ...forever,
    }),
  loading: () => toast.loading("Uploading capture"),
  stack: () => {
    toast.success("Copied");
    toast.error("Could not reach the machine", {
      description: "The device went offline two minutes ago.",
    });
    toast.warning("Low on disk");
    toast.info("Review queued", {
      description: "Findings arrive in a moment.",
    });
    toast("Thread archived");
  },
};

function ToastsHarness() {
  const { mode } = Route.useSearch();
  useLayoutEffect(() => applyColorMode(mode), [mode]);
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: 16 }}>
      {Object.keys(fire).map((name) => (
        <Button
          key={name}
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fire[name as keyof typeof fire]()}
        >
          {name}
        </Button>
      ))}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => toast.dismiss()}
      >
        dismiss all
      </Button>
    </div>
  );
}
