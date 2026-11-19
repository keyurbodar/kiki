import { useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/reactivity";
import { lazy, Suspense } from "react";
import type { JamId, OrgId } from "@/data/api/schemas/ids";
import { overviewPullsAtom } from "@/data/atoms/overview";
import type { TimelineRow } from "@/data/events";
import { AttachmentPane } from "@/features/thread-panes/attachment-pane";
import { BrowserPane } from "@/features/thread-panes/browser-pane";
import { MachinePathView } from "@/features/thread-panes/machine-path-view";
import { parsePull, valueList } from "@/features/thread-panes/overview/parse";
import { PaneNotice } from "@/features/thread-panes/pane-notice";
import { PaperPane } from "@/features/thread-panes/paper-pane";
import { ServicePreviewPane } from "@/features/thread-panes/service-preview-pane";
import { SubthreadPane } from "@/features/thread-panes/subthread-pane";
import type { PaneTab } from "@/features/thread-panes/tab-strip";
import { findPane } from "@/features/thread-panes/thread-pane";

const IssuePane = lazy(() =>
  import("@/features/issues/issue-panel").then((module) => ({
    default: module.IssuePane,
  })),
);

const PullPreview = lazy(() =>
  import("@/components/pull-preview/pull-panel").then((module) => ({
    default: module.PullPreview,
  })),
);

/** The pull a `pr:` tab names, so the pane can read it by its id. */
function usePullId(
  orgId: OrgId | undefined,
  threadId: string,
  number: number,
  url: string,
): string | undefined {
  const pulls = useAtomValue(
    orgId === undefined
      ? overviewPullsAtom("" as OrgId, "")
      : overviewPullsAtom(orgId, threadId),
  );
  if (!AsyncResult.isSuccess(pulls)) return undefined;
  return valueList(pulls.value)
    .map(parsePull)
    .find((pull) => pull?.number === number && pull?.url === url)?.id;
}

/**
 * The element a panel tab shows. A registered pane renders its own component;
 * the tabs the strip keys itself — a pull request, an issue, a file — render
 * here, beside the panes, because no route names them.
 */
export function PaneContent({
  tab,
  threadId,
  orgId,
  onFocus,
  rows = [],
}: {
  tab: PaneTab;
  threadId: string;
  orgId: OrgId | undefined;
  /** Clears a files tab's focus intent once the pane has used it. */
  onFocus?: (focus: undefined) => void;
  /** The transcript's rows, for the panes that resolve a file a message holds. */
  rows?: readonly TimelineRow[];
}) {
  switch (tab.kind) {
    case "issue":
      return (
        <Suspense fallback={null}>
          <IssuePane code={tab.code} />
        </Suspense>
      );
    case "pr":
      return (
        <Suspense fallback={null}>
          <PullPane
            orgId={orgId}
            threadId={threadId}
            number={tab.number}
            url={tab.url}
          />
        </Suspense>
      );
    case "file":
      return (
        <MachinePathView
          tabId={`file:${tab.path}`}
          jamId={tab.jamId ?? threadId}
          path={tab.path}
        />
      );
    case "browser":
      return (
        <Suspense fallback={null}>
          <BrowserPane threadId={threadId} sessionId={tab.id} url={tab.url} />
        </Suspense>
      );
    case "paper":
      return (
        <PaperPane
          orgId={orgId}
          jamId={tab.jamId}
          fileId={tab.fileId}
          title={tab.title}
        />
      );
    case "side_thread":
      return (
        <SubthreadPane
          orgId={orgId}
          jamId={tab.jamId as JamId}
          label="Side thread"
        />
      );
    case "task":
      return (
        <SubthreadPane
          orgId={orgId}
          jamId={tab.jamId as JamId}
          label={
            tab.localIndex === null ? "Subagent" : `Subagent ${tab.localIndex}`
          }
        />
      );
    case "attachment":
      return <AttachmentPane tab={tab} rows={rows} />;
    case "service_preview":
      return (
        <ServicePreviewPane
          orgId={orgId}
          jamId={threadId}
          machineId={tab.machineId}
          port={tab.port}
          title={tab.title}
        />
      );
    default: {
      const entry = findPane(tab.kind);
      // A kind with no pane used to return null here, so the tab opened and the
      // panel painted nothing. Say what the tab is instead of standing empty.
      if (entry === undefined) return <PaneNotice kind={tab.kind} />;
      const Pane = entry.component;
      return (
        <Suspense fallback={null}>
          <Pane
            threadId={threadId}
            focus={tab.kind === "files" ? tab.focus : undefined}
            onFocus={onFocus}
          />
        </Suspense>
      );
    }
  }
}

function PullPane({
  orgId,
  threadId,
  number,
  url,
}: {
  orgId: OrgId | undefined;
  threadId: string;
  number: number;
  url: string;
}) {
  const pullId = usePullId(orgId, threadId, number, url);
  const repo = /github\.com\/([^/]+\/[^/]+)\/pull\//.exec(url)?.[1] ?? "";
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PullPreview
        pullId={pullId ?? ""}
        repo={repo}
        number={number}
        org={orgId}
        onClose={() => undefined}
      />
    </div>
  );
}
