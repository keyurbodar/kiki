import { ActivityRow } from "@/features/thread/activity-row";
import { defineTimelineRow } from "../registry";

export const entry = defineTimelineRow({
  type: "activity",
  component: ActivityRow,
});
