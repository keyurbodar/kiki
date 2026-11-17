import {
  type HunkRow,
  parseHunkRows,
} from "@/components/suggestion-block/patch";

export type DiffRow =
  | { type: "hunk"; header: string }
  | { type: "line"; row: HunkRow };

export const diffRows = (patch: string): DiffRow[] => {
  const rows: DiffRow[] = [];
  for (const chunk of patch.split(/(?=^@@ )/m)) {
    const header = chunk.split("\n", 1)[0] ?? "";
    if (!header.startsWith("@@")) continue;
    rows.push({ type: "hunk", header });
    for (const row of parseHunkRows(chunk.replace(/\n$/, "")))
      rows.push({ type: "line", row });
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
