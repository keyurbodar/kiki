import { PhoneCard } from "@/features/thread/phone-card";
import { defineTimelineRow } from "../registry";

export const entry = defineTimelineRow({
  type: "phone-card",
  component: PhoneCard,
});
