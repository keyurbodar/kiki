import { MarkerDivider } from "@/features/thread/markers";
import { defineTimelineRow } from "../registry";

export const entry = defineTimelineRow({
  type: "marker",
  component: MarkerDivider,
});
