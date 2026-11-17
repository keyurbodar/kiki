import { VisualRow } from "@/features/thread/visual";
import { defineTimelineRow } from "../registry";

export const entry = defineTimelineRow({
  type: "visual",
  component: VisualRow,
});
