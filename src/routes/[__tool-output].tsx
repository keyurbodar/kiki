import { createFileRoute, notFound } from "@tanstack/react-router";
import { useLayoutEffect } from "react";
import type { ActivityRow } from "@/data/events";
import { ToolBody } from "@/features/thread/tool-body";
import { applyColorMode, type ColorMode } from "@/tokens/theme";

/**
 * Tool output as a reader meets it, so the normalizer can be driven and looked
 * at: colour escapes, a carriage-returned progress bar, tabs, and a log long
 * enough to be tailed. Capy reads these bytes in a terminal; we render a
 * `<pre>`, so what shows here is what the reader gets.
 */

type Search = { mode: ColorMode };

export const Route = createFileRoute("/__tool-output")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    mode:
      search.mode === "light" || search.mode === "dark"
        ? search.mode
        : "system",
  }),
  beforeLoad: () => {
    if (!import.meta.env.DEV) throw notFound();
  },
  component: ToolOutputHarness,
});

type ToolRow = Extract<typeof ActivityRow.Type, { kind: "tool" }>;

const at = (ms: number) => new Date(Date.UTC(2026, 0, 1, 12, 0, 0) + ms);

const row = (command: string, text: string, over: object = {}) =>
  ({
    id: "toolu_harness",
    eventId: "01JAAAAAAAAAAAAAAAAAAAAAAA",
    createdAt: at(0),
    type: "activity",
    kind: "tool",
    toolName: "bash",
    args: { command },
    phase: "done",
    turnOpen: false,
    turnCloses: false,
    startedAt: at(0),
    result: {
      blocks: [{ type: "text", text }],
      isError: false,
      settledAt: at(2_400),
    },
    ...over,
  }) as unknown as ToolRow;

const coloured = row(
  "bun test",
  "\u001b[32mPASS\u001b[0m src/auth.test.ts\n\u001b[31mFAIL\u001b[0m src/retry.test.ts\n\u001b[2K\u001b[1G12 passed, 1 failed",
);

const progress = row(
  "bun install",
  "Resolving dependencies\n0%\r12%\r38%\r74%\r100%\n\u001b]0;done\u0007installed 512 packages",
);

const tabbed = row("ls -la", "total 8\n\tdir\tentry.ts\n\t\tindex.ts");

const tailed = row(
  "bun run build",
  Array.from({ length: 460 }, (_, i) => `built chunk ${i}`).join("\n"),
);

const rows: ReadonlyArray<ToolRow> = [coloured, progress, tabbed, tailed];

function ToolOutputHarness() {
  const { mode } = Route.useSearch();
  useLayoutEffect(() => applyColorMode(mode), [mode]);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        padding: 24,
        maxWidth: 900,
      }}
    >
      {rows.map((each, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: fixed harness list
        <ToolBody key={index} row={each} />
      ))}
    </div>
  );
}
