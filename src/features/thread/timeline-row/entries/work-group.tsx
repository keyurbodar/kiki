import { WorkGroup } from "@/features/thread/work-group";
import { defineTimelineRow } from "../registry";

export const entry = defineTimelineRow({
  type: "work-group",
  component: WorkGroup,
});
