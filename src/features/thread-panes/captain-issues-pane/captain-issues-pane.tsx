import { useNavigate } from "@tanstack/react-router";
import {
  CaptainIssuesList,
  CaptainIssuesToolbar,
  CaptainIssuesView,
} from "@/components/captain-issues";
import type { PaneProps } from "@/features/thread-panes/thread-pane/registry";

/** The crew issues pane (`?pane=captain_issues`) of a Captain's thread. */
export function CaptainIssuesPane({ threadId }: PaneProps) {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <CaptainIssuesView
        jamId={threadId}
        toolbar={CaptainIssuesToolbar}
        list={CaptainIssuesList}
        onOpenIssue={(code) =>
          void navigate({ to: "/issues/$code", params: { code } })
        }
      />
    </div>
  );
}
