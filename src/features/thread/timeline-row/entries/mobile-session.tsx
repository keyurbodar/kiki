import { MobileSession } from "@/features/thread/mobile-session";
import { defineTimelineRow } from "../registry";

export const entry = defineTimelineRow({
  type: "mobile-session",
  component: MobileSession,
});
