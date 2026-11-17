import type { KeyboardEvent } from "react";

export type CommitScope = { from: string | null; to: string };

export type RangeCommit = { sha: string; message: string };

export type RangePull = { baseSha: string; headSha: string; baseRef: string };

export const shortSha = (sha: string) => sha.slice(0, 7);

export const commitSubject = (message: string) => message.split("\n")[0] ?? "";

/**
 * Row indices of the compared range. Row 0 is the base, row n is the n-th
 * commit; `to` is the newest included commit, `from` the row just below
 * the oldest.
 */
export const rangeRows = (
  commits: ReadonlyArray<RangeCommit>,
  scope: CommitScope | null,
) => {
  const count = commits.length;
  const rowOf = (sha: string) =>
    commits.findIndex((commit) => commit.sha === sha) + 1;
  const to = scope === null ? count : rowOf(scope.to) || count;
  const from =
    scope === null
      ? 0
      : scope.from === null
        ? to - 1
        : Math.min(rowOf(scope.from), to - 1);
  return { from, to };
};

const shaAt = (commits: ReadonlyArray<RangeCommit>, row: number) =>
  commits[row - 1]?.sha ?? "";

/** The scope for a picked range; the whole pull is null. */
export const scopeForRange = (
  pull: RangePull,
  commits: ReadonlyArray<RangeCommit>,
  from: number,
  to: number,
): CommitScope | null =>
  from === 0 && shaAt(commits, to) === pull.headSha
    ? null
    : {
        from: from === 0 ? pull.baseSha : shaAt(commits, from),
        to: shaAt(commits, to),
      };

/** The scope for one commit on its own. */
export const scopeForCommit = (
  commits: ReadonlyArray<RangeCommit>,
  row: number,
): CommitScope => ({ from: null, to: shaAt(commits, row) });

/** The chip text for an active scope, `from` and `to` around the dots. */
export const scopeLabel = (
  commits: ReadonlyArray<RangeCommit>,
  scope: CommitScope,
) => {
  if (scope.from === null) return { single: shortSha(scope.to) } as const;
  const { from } = rangeRows(commits, scope);
  return {
    from: from === 0 ? "base" : shortSha(shaAt(commits, from)),
    to: shortSha(scope.to),
  } as const;
};

/** Which radio cells exist, are on, and are disabled. */
export const radioCell = (
  side: "from" | "to",
  row: number,
  count: number,
  from: number,
  to: number,
) => ({
  shown: side === "from" ? row < count : row > 0,
  on: side === "from" ? row === from : row === to,
  dim: side === "from" ? row >= to : row <= from,
  inRange: side === "to" && row > from && row <= to,
});

const columns = ["from", "to", "body"] as const;

const arrowSteps: Record<string, readonly [number, number]> = {
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
};

type Cell = { column: number; row: number };

/** The nearest enabled cell in the arrow's direction, or undefined. */
export const nextCell = <C extends Cell>(
  key: string,
  current: Cell,
  cells: ReadonlyArray<C>,
): C | undefined => {
  const step = arrowSteps[key];
  if (step === undefined) return undefined;
  const [dx, dy] = step;
  const distance = (cell: Cell) =>
    Math.abs(cell.row - current.row) + Math.abs(cell.column - current.column);
  return cells
    .filter((cell) =>
      dy === 0
        ? cell.row === current.row &&
          Math.sign(cell.column - current.column) === dx
        : cell.column === current.column &&
          Math.sign(cell.row - current.row) === dy,
    )
    .toSorted((a, b) => distance(a) - distance(b))[0];
};

/** Arrow keys move between the grid's radio and body cells. */
export const onRangeGridKeyDown = (event: KeyboardEvent<HTMLElement>) => {
  const target = event.target;
  if (!(target instanceof HTMLElement) || target.dataset.col === undefined)
    return;
  const current = {
    column: columns.indexOf(target.dataset.col as (typeof columns)[number]),
    row: Number(target.dataset.row),
  };
  const cells = [
    ...event.currentTarget.querySelectorAll<HTMLButtonElement>(
      "button[data-col]",
    ),
  ].flatMap((cell) =>
    cell.disabled
      ? []
      : [
          {
            cell,
            column: columns.indexOf(
              cell.dataset.col as (typeof columns)[number],
            ),
            row: Number(cell.dataset.row),
          },
        ],
  );
  const next = nextCell(event.key, current, cells);
  if (next === undefined) return;
  event.preventDefault();
  next.cell.focus();
};
