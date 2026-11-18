import { SetupView } from "@/features/thread-panes/setup-view";
import { definePane, type PaneProps } from "../registry";

function SetupPane({ threadId }: PaneProps) {
  return <SetupView threadId={threadId} />;
}

export const entry = definePane({
  id: "setup",
  label: "Setup",
  order: 30,
  surface: "main",
  component: SetupPane,
});
