import { CaptainIssuesPane } from "@/features/thread-panes/captain-issues-pane";
import { definePane } from "../registry";

/** `captain_issues` is Capy's own `?pane=` value for the Issues pane, not a typo. */
export const entry = definePane({
  id: "captain_issues",
  label: "Issues",
  order: 60,
  component: CaptainIssuesPane,
});
