import { createFileRoute, notFound } from "@tanstack/react-router";
import { useLayoutEffect, useState } from "react";
import { Button } from "@/primitives/button";
import { TextMorph } from "@/primitives/text-morph";
import { applyColorMode, type ColorMode } from "@/tokens/theme";

/**
 * Text that carries itself to its next value, so the morph can be watched and
 * measured: an amount, a count, and a label. The changed characters move and
 * the shared ones stay, which is what separates this from a swap.
 */

type Search = { mode: ColorMode };

export const Route = createFileRoute("/__text-morph")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    mode:
      search.mode === "light" || search.mode === "dark"
        ? search.mode
        : "system",
  }),
  beforeLoad: () => {
    if (!import.meta.env.DEV) throw notFound();
  },
  component: TextMorphHarness,
});

const AMOUNTS = ["$1.20", "$1.30", "$12.40", "$0.05"];
const STATES = ["Working", "Worked"];

function TextMorphHarness() {
  const { mode } = Route.useSearch();
  useLayoutEffect(() => applyColorMode(mode), [mode]);
  const [step, setStep] = useState(0);
  const amount = AMOUNTS[step % AMOUNTS.length] as string;
  const state = STATES[step % STATES.length] as string;
  return (
    <div
      style={{ display: "flex", flexDirection: "column", gap: 16, padding: 24 }}
    >
      <div style={{ display: "flex", gap: 8 }}>
        <Button
          type="button"
          variant="solid"
          size="sm"
          onClick={() => setStep((n) => n + 1)}
        >
          next
        </Button>
      </div>
      <span
        data-slot="cost-value"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        <TextMorph>{amount}</TextMorph>
      </span>
      <span data-slot="work-state">
        <TextMorph>{state}</TextMorph>
      </span>
    </div>
  );
}
