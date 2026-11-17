import { AgentMessage } from "@/features/thread/agent-message";
import { defineTimelineRow } from "../registry";

export const entry = defineTimelineRow({
  type: "agent-message",
  component: ({ row }) => <AgentMessage row={row} />,
});
