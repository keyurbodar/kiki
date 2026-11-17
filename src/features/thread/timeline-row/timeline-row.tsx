import type { TimelineRow as TimelineRowData } from "@/data/events";
import { type TimelineRowEntry, timelineRows } from "./registry";

export type TimelineRowProps = { row: TimelineRowData };

export function TimelineRow({ row }: TimelineRowProps) {
  const entry = timelineRows.get(row.type) as TimelineRowEntry | undefined;
  if (!entry) return null;
  const Component = entry.component as TimelineRowEntry["component"];
  return <Component row={row as never} />;
}
