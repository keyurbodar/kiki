import {
  SummaryCard,
  type SummarySetupReference,
} from "@/features/thread/summary-card";
import { defineTimelineRow, type TimelineRowOf } from "../registry";

const isSetupReference = (value: unknown): value is SummarySetupReference =>
  typeof value === "object" &&
  value !== null &&
  "kind" in value &&
  (value.kind === "version" ||
    value.kind === "build" ||
    value.kind === "snapshots");

function SummaryRow({ row }: { row: TimelineRowOf<"summary"> }) {
  return (
    <SummaryCard
      turn={{
        prs: row.prs,
        ports: row.ports,
        automations: row.automations.flatMap((a) =>
          typeof a === "object" && a !== null && "bound" in a
            ? [{ bound: a.bound === true }]
            : [],
        ),
        environmentRequests: row.environmentRequests.flatMap((r) =>
          typeof r === "object" &&
          r !== null &&
          "variables" in r &&
          Array.isArray(r.variables)
            ? [{ variables: r.variables.map(String) }]
            : [],
        ),
        setup: row.setup.filter(isSetupReference),
      }}
    />
  );
}

export const entry = defineTimelineRow({
  type: "summary",
  component: SummaryRow,
});
