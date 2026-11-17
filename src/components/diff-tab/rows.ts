import {
  type HunkRow,
  parseHunkRows,
} from "@/components/suggestion-block/patch";

export type DiffRow =
  | { type: "hunk"; header: string }
  | { type: "line"; row: HunkRow }
  | { type: "run"; key: string; rows: ReadonlyArray<HunkRow> };

export type DiffRowsOptions = {
  expandedRuns?: ReadonlySet<string>;
  pinnedLines?: ReadonlySet<string>;
};

const minRunRows = 3;

export const unchangedLabel = (count: number) =>
  count === 1 ? "1 unchanged line" : `${count} unchanged lines`;

export const runKey = (rows: ReadonlyArray<HunkRow>) =>
  rows[0] === undefined ? "" : rowKey(rows[0]);

export const diffRows = (
  patch: string,
  { expandedRuns = new Set(), pinnedLines = new Set() }: DiffRowsOptions = {},
): DiffRow[] => {
  const rows: DiffRow[] = [];
  for (const chunk of patch.split(/(?=^@@ )/m)) {
    const header = chunk.split("\n", 1)[0] ?? "";
    if (!header.startsWith("@@")) continue;
    rows.push({ type: "hunk", header });
    let run: HunkRow[] = [];
    const flush = () => {
      const key = runKey(run);
      const visible =
        run.length < minRunRows ||
        expandedRuns.has(key) ||
        run.some((row) => pinnedLines.has(rowKey(row)));
      if (run.length > 0)
        rows.push(
          ...(visible
            ? run.map((row) => ({ type: "line" as const, row }))
            : [{ type: "run" as const, key, rows: run }]),
        );
      run = [];
    };
    for (const row of parseHunkRows(chunk.replace(/\n$/, ""))) {
      if (row.marker === " ") run.push(row);
      else {
        flush();
        rows.push({ type: "line", row });
      }
    }
    flush();
  }
  return rows;
};

export const rowKey = (row: HunkRow) =>
  row.marker === "-" ? `LEFT:${row.oldNo}` : `RIGHT:${row.newNo}`;

export const anchorKey = (side: "LEFT" | "RIGHT", line: number) =>
  `${side}:${line}`;

export const fileStats = (
  files: ReadonlyArray<{ additions: number | null; deletions: number | null }>,
) =>
  files.reduce<{ additions: number; deletions: number }>(
    (total, file) => ({
      additions: total.additions + (file.additions ?? 0),
      deletions: total.deletions + (file.deletions ?? 0),
    }),
    { additions: 0, deletions: 0 },
  );

export const diffNotes = (diff: {
  stale: boolean;
  truncated: number | null;
}) => [
  ...(diff.stale ? ["behind the latest push"] : []),
  ...(diff.truncated === null ? [] : ["some files omitted"]),
];
