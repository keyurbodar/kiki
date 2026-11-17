import {
  DiagramWindow,
  MarkdownMermaid,
  MermaidMessageContext,
  Visual,
} from "@/components/markdown";

/** Thread id that turns the diagram route into a dev-only fixture page (never in production builds). */
export const DIAGRAM_PREVIEW_ID = "__preview";

const FLOW = `flowchart LR
  A[Open pull request] --> B{CI green?}
  B -- yes --> C[Request review]
  B -- no --> D[Fix failing checks]
  D --> B
  C --> E[Merge]`;

const SEQUENCE = `sequenceDiagram
  participant Web
  participant API
  participant Worker
  Web->>API: POST /jobs
  API->>Worker: enqueue(job)
  Worker-->>API: done
  API-->>Web: 201 Created`;

const BROKEN = `flowchart TD
  A[Start] -->`;

const MESSAGE = [
  "```mermaid",
  FLOW,
  "```",
  "",
  "```mermaid",
  SEQUENCE,
  "```",
].join("\n");

const CHART = `<style>
  .axis { stroke: var(--grid); }
  .tick { fill: var(--muted); font-size: 0.85em; }
</style>
<app-tabs name="metric" options='["Requests","Errors"]' value="Requests"></app-tabs>
<app-legend items='[{"label":"api","color":1},{"label":"web","color":2},{"label":"worker","color":3}]'></app-legend>
<svg id="chart" viewBox="0 0 620 240" role="img" aria-label="Weekly requests by service"></svg>
<script>
  const DATA = {
    Requests: [[120, 132, 101, 134, 90], [220, 182, 191, 234, 290], [150, 232, 201, 154, 190]],
    Errors: [[2, 4, 1, 3, 2], [5, 3, 6, 2, 4], [1, 2, 1, 4, 3]],
  };
  const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const NAMES = ["api", "web", "worker"];
  const svg = document.getElementById("chart");
  function draw(metric) {
    const rows = DATA[metric];
    const m = visual.inset();
    const w = 620, h = 240, pw = w - m.left - m.right, ph = h - m.top - m.bottom;
    const max = Math.max(...rows.flat()) * 1.1;
    const group = pw / DAYS.length, bar = (group * 0.7) / rows.length;
    let s = "";
    for (let i = 0; i <= 4; i++) {
      const y = m.top + ph - (ph * i) / 4;
      s += '<line class="axis" x1="' + m.left + '" x2="' + (m.left + pw) + '" y1="' + y + '" y2="' + y + '"/>';
      s += '<text class="tick" x="' + (m.left - 6) + '" y="' + (y + 4) + '" text-anchor="end">' + Math.round((max * i) / 4) + '</text>';
    }
    DAYS.forEach((day, i) => {
      const x0 = m.left + group * i + group * 0.15;
      rows.forEach((row, j) => {
        const v = row[i], bh = (v / max) * ph;
        s += '<rect data-series="' + NAMES[j] + '" data-label="' + day + '" data-value="' + v + '" x="' + (x0 + bar * j) + '" y="' + (m.top + ph - bh) + '" width="' + (bar - 2) + '" height="' + bh + '" rx="2" fill="' + visual.color(j) + '"/>';
      });
      s += '<text class="tick" x="' + (x0 + bar * 1.5) + '" y="' + (h - m.bottom + 18) + '" text-anchor="middle">' + day + '</text>';
    });
    visual.render(svg, s);
  }
  draw(visual.get("metric") || "Requests");
  visual.on("change", (state) => draw(state.metric));
</script>`;

const STATS = `<div>
  <app-stat label="Deploys" value="48" delta="+12%" note="last 30 days"></app-stat>
  <app-stat label="Median build" value="3.2 min" delta="-0.3 min"></app-stat>
  <app-stat label="Failed runs" value="4" delta="+1"></app-stat>
</div>
<app-table columns='[{"key":"service","label":"Service"},{"key":"p50","label":"p50"},{"key":"p95","label":"p95"}]'
  rows='[{"service":"api","p50":42,"p95":180},{"service":"web","p50":18,"p95":96},{"service":"worker","p50":120,"p95":640}]'></app-table>`;

export type RichContentPreviewProps = { view: string; index: number };

/** Dev-only fixture page for B6's rich content: /diagram/__preview/<mermaid|visual|window>/<index>. */
export function RichContentPreview({ view, index }: RichContentPreviewProps) {
  if (view === "window")
    return (
      <DiagramWindow
        threadTitle="Release checklist"
        text={[FLOW, SEQUENCE][index] ?? FLOW}
        complete
        onOpenThread={() => undefined}
      />
    );
  return (
    <main className="mx-auto flex w-full max-w-4xl min-w-0 flex-col gap-3 bg-background px-4 py-6 text-sm">
      {view === "visual" ? (
        <>
          <Visual
            row={{
              toolCallId: "call_preview_chart",
              title: "Weekly requests by service",
              html: CHART,
            }}
          />
          <Visual
            row={{
              toolCallId: "call_preview_stats",
              title: "Delivery health",
              html: STATS,
            }}
          />
        </>
      ) : (
        <MermaidMessageContext.Provider
          value={{
            jamId: DIAGRAM_PREVIEW_ID,
            messageId: "window",
            text: MESSAGE,
          }}
        >
          <MarkdownMermaid text={FLOW} complete />
          <MarkdownMermaid text={SEQUENCE} complete />
          <MarkdownMermaid text={BROKEN} complete />
        </MermaidMessageContext.Provider>
      )}
    </main>
  );
}
