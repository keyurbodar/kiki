import type { ComponentType } from "react";
import type { TimelineRow } from "@/data/events";

export type TimelineRowType = TimelineRow["type"];
export type TimelineRowOf<T extends TimelineRowType> = Extract<
  TimelineRow,
  { type: T }
>;

export type TimelineRowEntry<T extends TimelineRowType = TimelineRowType> = {
  type: T;
  component: ComponentType<{ row: TimelineRowOf<T> }>;
};

type AnyTimelineRowEntry = {
  [T in TimelineRowType]: TimelineRowEntry<T>;
}[TimelineRowType];

export function defineTimelineRow<T extends TimelineRowType>(
  entry: TimelineRowEntry<T>,
): TimelineRowEntry<T> {
  return entry;
}

export function collectTimelineRows(
  entries: readonly AnyTimelineRowEntry[],
): ReadonlyMap<TimelineRowType, AnyTimelineRowEntry> {
  const byType = new Map<TimelineRowType, AnyTimelineRowEntry>();
  for (const entry of entries) {
    if (byType.has(entry.type)) {
      throw new Error(`Duplicate timeline row renderer for "${entry.type}"`);
    }
    byType.set(entry.type, entry);
  }
  return byType;
}

const modules = import.meta.glob<{ entry: AnyTimelineRowEntry }>(
  "./entries/*.tsx",
  { eager: true },
);

export const timelineRows = collectTimelineRows(
  Object.values(modules).map((module) => module.entry),
);
