import { ThreadSummaryPane } from "@/features/thread-panes/thread-summary-pane";
import { definePane } from "../registry";

/** `chat` is Capy's own `?pane=` value for the thread summary, not the chat column. */
export const entry = definePane({
  id: "chat",
  label: "Thread",
  order: -1,
  component: ThreadSummaryPane,
});
