import type { TimelineRow } from "@/data/events";
import { STAMP_GAP } from "./format-stamp";

export type RowGapKind = "tight" | "same" | "turn" | "lead" | "stamp";
export type RowGap = { gap: RowGapKind; stamp?: Date };

/** Stable list key: an optimistic user message keeps its client key until the server echo lands. */
export const rowKey = (row: TimelineRow): string =>
  row.type === "user-message" && row.clientKey !== undefined
    ? `client:${row.clientKey}`
    : row.id;

const speaker = (row: TimelineRow): string | undefined => {
  if (row.type === "agent-message") return "agent";
  if (row.type !== "user-message") return undefined;
  const { actor } = row;
  if (actor.type === "user") return actor.userId;
  if (actor.type === "agent") return actor.jamId;
  return actor.type;
};

const startedAt = (row: TimelineRow): Date =>
  row.type === "cluster"
    ? (row.members[0]?.createdAt ?? row.createdAt)
    : row.createdAt;

const isDivider = (row: TimelineRow) =>
  row.type === "cluster" ||
  row.type === "marker" ||
  (row.type === "user-message" && row.origin.type === "automation");

/** Spacing when nothing says otherwise: only a message that opens the list leads into it. */
export const defaultGap = (row: TimelineRow): RowGapKind =>
  row.type === "user-message" ? "lead" : "tight";

const gapBetween = (row: TimelineRow, previous?: TimelineRow): RowGapKind => {
  if (previous === undefined) return defaultGap(row);
  if (isDivider(row) || isDivider(previous)) return "tight";
  const before = speaker(previous);
  const after = speaker(row);
  if (before === undefined || after === undefined) return "tight";
  return before === after ? "same" : "turn";
};

/**
 * Spacing above each row and the time stamps between turns. A stamp sits above
 * a user message that opens the list or follows the row before it by an hour
 * or more; every other row is spaced by who spoke.
 */
export function computeRowGaps(
  rows: readonly TimelineRow[],
): ReadonlyMap<string, RowGap> {
  return new Map(
    rows.map((row, index) => {
      const previous = rows[index - 1];
      const opensTurn = row.type === "user-message";
      const stamped =
        opensTurn &&
        (previous === undefined ||
          startedAt(row).getTime() - previous.createdAt.getTime() >= STAMP_GAP);
      return [
        rowKey(row),
        {
          gap:
            stamped && previous !== undefined
              ? "stamp"
              : gapBetween(row, previous),
          stamp: stamped ? startedAt(row) : undefined,
        },
      ];
    }),
  );
}

/** Row spacing in spacing units, wide then narrow (below md). */
export const ROW_GAP_STEPS: Record<RowGapKind, readonly [number, number]> = {
  tight: [3, 2.5],
  same: [3, 2.5],
  turn: [8, 7],
  lead: [6, 5],
  stamp: [10, 9],
};

export const rowGapStyle = (gap: RowGapKind) => {
  const [wide, narrow] = ROW_GAP_STEPS[gap];
  return {
    "--row-gap": `calc(var(--spacing) * ${wide})`,
    "--row-gap-narrow": `calc(var(--spacing) * ${narrow})`,
  } as React.CSSProperties;
};

/** Messages after the given row, for the scroll pill's count. */
export function countMessagesBelow(
  rows: readonly TimelineRow[],
  lastVisibleKey: string | null,
): number {
  if (lastVisibleKey === null) return 0;
  const index = rows.findIndex((row) => rowKey(row) === lastVisibleKey);
  if (index < 0) return 0;
  return rows
    .slice(index + 1)
    .filter(
      (row) => row.type === "user-message" || row.type === "agent-message",
    ).length;
}
