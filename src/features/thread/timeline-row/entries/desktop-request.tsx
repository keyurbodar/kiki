import { defineTimelineRow } from "../registry";

/**
 * Capy draws no row for a desktop request: the ask lives in the composer
 * takeover above the input, so the transcript stays quiet where it sat.
 */
export const entry = defineTimelineRow({
  type: "desktop-request",
  component: () => null,
});
