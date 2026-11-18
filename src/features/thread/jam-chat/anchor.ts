import type { TimelineRow } from "@/data/events";
import { rowKey } from "./row-gaps";

/** Where the transcript is held: the row at the top edge of the viewport, and
 *  how far that row's top sits above the edge. */
export type ChatAnchor = { key: string; offset: number };

export type ChatPosition = {
  /** Null before a row reaches the top edge, which is the state a fresh pin to the end starts in. */
  anchor: ChatAnchor | null;
  /** The last row that starts above the viewport's bottom edge: what the scroll pill counts below. */
  lastVisibleKey: string | null;
};

/**
 * Where the scrolled transcript sits, read from row tops in content
 * coordinates. Rows are in the order they render, so the scan stops at the
 * first row below the fold instead of measuring the whole transcript.
 */
export function positionOf(
  rows: readonly TimelineRow[],
  scrollTop: number,
  viewportHeight: number,
  topOf: (index: number) => number,
): ChatPosition {
  const bottom = scrollTop + viewportHeight;
  let anchor: ChatAnchor | null = null;
  let lastVisibleKey: string | null = null;
  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    if (row === undefined) break;
    const top = topOf(index);
    if (top >= bottom) break;
    lastVisibleKey = rowKey(row);
    if (top <= scrollTop) {
      anchor = { key: rowKey(row), offset: scrollTop - top };
    }
  }
  return { anchor, lastVisibleKey };
}

/**
 * How far to move `scrollTop` so the anchored row keeps the offset it was
 * captured at, which is what holds the reader's place when rows appear above
 * the viewport or a row above it grows. Null once the row is gone: there is
 * nothing left to hold, and the caller re-captures from where it is.
 */
export function anchorShift(
  anchor: ChatAnchor,
  rows: readonly TimelineRow[],
  scrollTop: number,
  topOf: (index: number) => number,
): number | null {
  const index = rows.findIndex((row) => rowKey(row) === anchor.key);
  if (index < 0) return null;
  return topOf(index) + anchor.offset - scrollTop;
}
