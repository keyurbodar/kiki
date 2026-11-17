import { UpdateRow } from "@/features/thread/update-row";
import { defineTimelineRow } from "../registry";

export const entry = defineTimelineRow({
  type: "update",
  component: UpdateRow,
});
