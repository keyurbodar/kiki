import { useAtomSet } from "@effect/atom-react";
import { Link, useNavigate } from "@tanstack/react-router";
import type { JamId, OrgId } from "@/data/api/schemas/ids";
import { JamChat } from "@/features/thread/jam-chat";
import type { ReplyTarget } from "@/features/thread/message-footer";
import { pendingReplyAtom } from "@/features/thread/reply-quote";
import { previewArt } from "@/features/thread/service-preview-surface/art.ts";
import { PreviewEmptyState } from "@/features/thread/service-preview-surface/empty-state.tsx";
import { ThreadMessageActions } from "@/features/thread/thread-view/message-actions";
import { useThreadTimeline } from "@/features/thread/timeline/use-thread-timeline";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";

export type SubthreadPaneProps = {
  orgId: OrgId | undefined;
  /** The child thread — a subagent or a side thread — whose transcript shows. */
  jamId: JamId;
  /** "Subagent 2", "Side thread", or the child's own title. */
  label: string;
};

/**
 * The `task` and `side_thread` tabs: another thread's conversation, beside the
 * one being read. The panel reads the child's own feed, so a subagent's rows
 * arrive while the parent transcript stays on screen.
 *
 * A pane has no composer, so Reply here opens the thread on its own route with
 * the quote waiting in that screen's draft: the pane's header already sends the
 * reader there to write, and a footer action that did nothing would be worse
 * than one that moves.
 */
export function SubthreadPane({ orgId, jamId, label }: SubthreadPaneProps) {
  const timeline = useThreadTimeline(orgId, jamId);
  const navigate = useNavigate();
  const setPendingReply = useAtomSet(pendingReplyAtom(jamId));
  const reply = (target: ReplyTarget) => {
    setPendingReply(target);
    void navigate({ to: "/thread/$threadId", params: { threadId: jamId } });
  };
  return (
    <div
      data-slot="subthread-pane"
      data-jam={jamId}
      className="kiki-pane flex-1"
    >
      <div className="kiki-pane-section shrink-0 border-b-hairline border-border-1">
        <span className="kiki-pane-section-trigger kiki-cell" data-col="text">
          <span className="truncate text-xs font-medium text-muted-foreground-1">
            {label}
          </span>
        </span>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={`Open ${label}`}
          render={<Link to="/thread/$threadId" params={{ threadId: jamId }} />}
        >
          <Icon name="arrow-corner-up-right" size="xs" />
        </Button>
      </div>
      {timeline.failed ? (
        <PreviewEmptyState
          art={previewArt.hanging}
          line="Couldn't load this thread"
          sub={label}
          action={
            <Button variant="outline" size="xs" onClick={timeline.retry}>
              Retry
            </Button>
          }
        />
      ) : timeline.rows.length === 0 && !timeline.loading ? (
        // An empty transcript is a state, not a blank panel.
        <PreviewEmptyState
          art={previewArt.sleep}
          line="Nothing here yet"
          sub={`${label} has no messages`}
        />
      ) : (
        <ThreadMessageActions orgId={orgId} jamId={jamId} reply={reply}>
          <JamChat
            data-thread-id={jamId}
            jamId={jamId}
            rows={timeline.rows}
            initialLoading={timeline.loading}
            onStartReached={timeline.hasOlder ? timeline.loadOlder : undefined}
            className="flex-1"
          />
        </ThreadMessageActions>
      )}
    </div>
  );
}
