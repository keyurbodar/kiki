import type { TimelineRow } from "@/data/events";
import { rowKey } from "./row-gaps";

/** Air left above the row a quote jumps to, so it does not sit against the edge. */
export const JUMP_LEAD = 12;

const SECTION_SELECTOR = '[data-slot="message-section"]';

/** A resolved jump: which row, which section of it, and where that row sits in the list. */
export type ChatJump = {
  rowKey: string;
  section: number;
  index: number;
  /** Bumped per request so clicking the same quote twice scrolls again. */
  request: number;
};

/** The slice of the virtual list a jump needs. */
export type JumpList = {
  scrollToOffset?: (params: { offset: number; animated?: boolean }) => unknown;
  scrollToIndex?: (params: {
    index: number;
    animated?: boolean;
    viewPosition?: number;
  }) => unknown;
};

/**
 * The row a quote points at. A reply carries the message's own row id, while a
 * selection quote carries the chat list's row key, which is what the timeline
 * puts on the DOM — so both forms resolve, and a cluster member resolves to the
 * cluster that holds it.
 */
export function rowForJump(
  rows: readonly TimelineRow[],
  rowId: string,
): TimelineRow | undefined {
  return (
    rows.find((row) => rowKey(row) === rowId) ??
    rows.find((row) => row.id === rowId) ??
    rows.find(
      (row) =>
        row.type === "cluster" &&
        row.members.some((member) => member.id === rowId),
    )
  );
}

const sectionOf = (row: Element, section: number) =>
  row.querySelectorAll(SECTION_SELECTOR)[section] ?? row;

/**
 * Scrolls the timeline to a quoted row and focuses the quoted section there.
 * Returns the element it landed on, or null when the row is not mounted — a
 * virtualised list only mounts what it is near, so the caller asks the list for
 * that index and tries again.
 */
export function jumpToRow(
  list: JumpList | null,
  scroll: HTMLElement | null,
  target: Pick<ChatJump, "rowKey" | "section" | "index">,
): Element | null {
  if (scroll === null) return null;
  const row =
    Array.from(scroll.querySelectorAll("[data-chat-row-id]")).find(
      (candidate) =>
        candidate.getAttribute("data-chat-row-id") === target.rowKey,
    ) ?? null;
  if (row === null) {
    list?.scrollToIndex?.({
      index: Math.max(0, target.index),
      animated: true,
      viewPosition: 0,
    });
    return null;
  }
  const element = sectionOf(row, target.section);
  if (list?.scrollToOffset !== undefined) {
    const offset =
      scroll.scrollTop +
      element.getBoundingClientRect().top -
      scroll.getBoundingClientRect().top -
      JUMP_LEAD;
    const furthest = Math.max(0, scroll.scrollHeight - scroll.clientHeight);
    list.scrollToOffset({
      offset: Math.max(0, Math.min(offset, furthest)),
      animated: true,
    });
  }
  if (element instanceof HTMLElement) {
    element.tabIndex = -1;
    element.focus({ preventScroll: true });
  }
  return element;
}
