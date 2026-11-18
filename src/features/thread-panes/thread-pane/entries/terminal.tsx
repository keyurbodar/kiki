import { TerminalPane } from "@/features/thread-panes/terminal-pane";
import { definePane, type PaneProps } from "../registry";

function TerminalTab({ threadId }: PaneProps) {
  return <TerminalPane threadId={threadId} />;
}

export const entry = definePane({
  id: "terminal",
  label: "Terminal",
  order: 50,
  component: TerminalTab,
});
