import { defineTimelineRow } from "../registry";

/** A feedback request is answered in the composer takeover, not in a row. */
export const entry = defineTimelineRow({
  type: "feedback-request",
  component: () => null,
});
