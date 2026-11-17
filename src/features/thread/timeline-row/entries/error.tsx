import { ErrorRow } from "@/features/thread/error-row";
import { defineTimelineRow } from "../registry";

export const entry = defineTimelineRow({
  type: "error",
  component: ErrorRow,
});
