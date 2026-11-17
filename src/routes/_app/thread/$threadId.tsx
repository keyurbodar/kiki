import { createFileRoute } from "@tanstack/react-router";
import { AutomationMessage } from "@/features/thread/automation-message";
import { SummaryCard } from "@/features/thread/summary-card";
import { searchParams } from "@/lib/search-params";

export const Route = createFileRoute("/_app/thread/$threadId")({
  validateSearch: searchParams(["pane"]),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100 }} className="bg-background">
      <div
        id="t07-automation"
        style={{ position: "absolute", left: 257, top: 66, width: 805 }}
      >
        <AutomationMessage
          title="Nightly check"
          date={new Date(Date.now() - 24 * 3600 * 1000)}
          body={
            "Read the notes in the project drive first and follow them. Check the open pull requests, rerun anything that failed overnight, and report back with one line per pull request. Leave branches and pull requests as they are. Reply with a short summary when you are done, then end your turn."
          }
        />
      </div>
      <div
        id="t07-summary"
        style={{ position: "absolute", left: 257, top: 339, width: 805 }}
      >
        <SummaryCard
          turn={{
            prs: [{ kind: "pr", number: 62, url: "https://github.com/acme/web/pull/62" }],
            ports: [],
            automations: [],
            environmentRequests: [],
            setup: [],
          }}
          pullRequests={[
            {
              number: 62,
              repo: "acme/web",
              title: "web: tokens and overlays for the dialog shell, notifications dialog, pane view picker",
              state: "merged",
              additions: 332,
              deletions: 320,
            },
          ]}
        />
      </div>
    </div>
  );
}
