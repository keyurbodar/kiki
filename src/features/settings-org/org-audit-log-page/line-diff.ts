export type DiffLine = {
  readonly sign: " " | "-" | "+";
  readonly text: string;
};

/** Past this many line pairs the diff falls back to set membership instead of an LCS table. */
const maxCells = 250_000;

/** Line diff of two texts: an LCS walk, or removed-then-added lines for very long inputs. */
export function lineDiff(from: string, to: string): ReadonlyArray<DiffLine> {
  const before = from.split("\n");
  const after = to.split("\n");
  if (before.length * after.length > maxCells) {
    const kept = new Set(before);
    const next = new Set(after);
    return [
      ...before
        .filter((line) => !next.has(line))
        .map((text) => ({ sign: "-" as const, text })),
      ...after
        .filter((line) => !kept.has(line))
        .map((text) => ({ sign: "+" as const, text })),
    ];
  }
  const table = before.map(() => after.map(() => 0));
  for (let i = before.length - 1; i >= 0; i--)
    for (let j = after.length - 1; j >= 0; j--) {
      const row = table[i];
      if (row === undefined) continue;
      row[j] =
        before[i] === after[j]
          ? 1 + (table[i + 1]?.[j + 1] ?? 0)
          : Math.max(table[i + 1]?.[j] ?? 0, row[j + 1] ?? 0);
    }
  const lines: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < before.length || j < after.length) {
    if (i < before.length && j < after.length && before[i] === after[j]) {
      lines.push({ sign: " ", text: before[i] ?? "" });
      i++;
      j++;
    } else if (
      i < before.length &&
      (j >= after.length ||
        (table[i + 1]?.[j] ?? 0) >= (table[i]?.[j + 1] ?? 0))
    ) {
      lines.push({ sign: "-", text: before[i] ?? "" });
      i++;
    } else {
      lines.push({ sign: "+", text: after[j] ?? "" });
      j++;
    }
  }
  return lines;
}

export const changedLineCount = (lines: ReadonlyArray<DiffLine>) =>
  Math.max(
    lines.filter((line) => line.sign === "-").length,
    lines.filter((line) => line.sign === "+").length,
  );
