import { AutomationRunMessage } from "@/features/thread/automation-message/automation-run-message";
import { UserMessage } from "@/features/thread/user-message";
import { defineTimelineRow } from "../registry";

export const entry = defineTimelineRow({
  type: "user-message",
  component: ({ row }) => {
    const { origin } = row;
    return origin.type === "automation" ? (
      <AutomationRunMessage
        automationId={origin.automationId}
        text={row.text}
        date={row.createdAt}
      />
    ) : (
      <UserMessage row={row} />
    );
  },
});
