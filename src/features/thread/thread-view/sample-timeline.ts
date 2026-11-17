import { Schema } from "effect";
import { makeThreadFixtures, TimelineRow } from "@/data/events";

const decodeRow = Schema.decodeUnknownSync(TimelineRow);

/**
 * Neutral sample rows for the thread view until the timeline builder lands.
 * Loose activity rows are dropped because the builder folds them into work
 * groups; the rest are ordered by time like the builder's output.
 */
export function sampleTimelineRows(): TimelineRow[] {
  return makeThreadFixtures()
    .rows.map((row) => decodeRow(row))
    .filter((row) => row.type !== "activity")
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}
