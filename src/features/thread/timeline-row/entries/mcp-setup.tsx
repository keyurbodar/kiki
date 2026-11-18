import { McpSetupLine } from "@/features/thread/mcp-setup-card";
import { decodeProposal } from "@/features/thread/mcp-setup-card/proposal";
import { defineTimelineRow, type TimelineRowOf } from "../registry";

function McpSetupRowView({ row }: { row: TimelineRowOf<"mcp-setup"> }) {
  const proposal = decodeProposal(row.proposal);
  if (proposal === undefined) return null;
  return (
    <McpSetupLine proposal={proposal} state="pending" actionable={false} />
  );
}

export const entry = defineTimelineRow({
  type: "mcp-setup",
  component: McpSetupRowView,
});
