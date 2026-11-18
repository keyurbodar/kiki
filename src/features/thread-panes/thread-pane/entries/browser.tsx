import { BrowserPane } from "@/features/thread-panes/browser-pane";
import { definePane, type PaneProps } from "../registry";

function BrowserTab({ threadId }: PaneProps) {
  return <BrowserPane threadId={threadId} />;
}

export const entry = definePane({
  id: "browser",
  label: "New tab",
  order: 40,
  component: BrowserTab,
});
