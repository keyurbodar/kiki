import { defineTimelineRow } from "../registry";

/** A terminal request is answered in the composer takeover, not in a row. */
export const entry = defineTimelineRow({
  type: "terminal-request",
  component: () => null,
});
