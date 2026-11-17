import { Schema } from "effect";
import { makeThreadFixtures, TimelineRow } from "@/data/events";

const decodeRow = Schema.decodeUnknownSync(TimelineRow);

const REQUEST_KINDS = new Set<TimelineRow["type"]>([
  "clarify",
  "environment-request",
  "desktop-request",
  "terminal-request",
  "feedback-request",
  "mcp-setup",
]);

export type ThreadSampleState = "plain" | "clarify" | "environment";

/**
 * Which request a sample thread leaves waiting on an answer, so the route can
 * show the composer, the clarify takeover and the environment takeover.
 */
const SAMPLE_STATES: Record<string, ThreadSampleState> = {
  jam_sample: "plain",
  jam_sample_clarify: "clarify",
  jam_sample_environment: "environment",
};

const keepsRequest = (state: ThreadSampleState, type: TimelineRow["type"]) => {
  if (!REQUEST_KINDS.has(type)) return true;
  return type === `${state}-request` || type === state;
};

/**
 * Neutral sample rows for the thread view until the timeline builder lands.
 * Loose activity rows are dropped because the builder folds them into work
 * groups; the rest are ordered by time like the builder's output.
 */
export function sampleTimelineRows(threadId: string): TimelineRow[] {
  const state = SAMPLE_STATES[threadId] ?? "plain";
  return makeThreadFixtures()
    .rows.map((row) => decodeRow(row))
    .filter((row) => row.type !== "activity")
    .filter((row) => keepsRequest(state, row.type))
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}
