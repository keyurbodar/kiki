import { CaptainIssuesPane } from "@/features/thread-panes/captain-issues-pane";
import { definePane } from "../registry";

export const entry = definePane({
  id: "captain_issues",
  label: "Issues",
  order: 60,
  component: CaptainIssuesPane,
});
