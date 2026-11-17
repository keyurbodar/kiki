import { UserMessage } from "@/features/thread/user-message";
import { defineTimelineRow } from "../registry";

export const entry = defineTimelineRow({
  type: "user-message",
  component: ({ row }) => <UserMessage row={row} />,
});
