import { cx } from "class-variance-authority";
import type { ReactNode } from "react";
import { AppTopBar } from "@/components/app-top-bar";
import { Composer } from "@/components/composer";
import type { TimelineRow } from "@/data/events";
import { JamChat } from "@/features/thread/jam-chat";
import { ChatSkeleton } from "./chat-skeleton";

export type ThreadViewProps = {
  threadId: string;
  rows: readonly TimelineRow[];
  loading?: boolean;
  topBar?: ReactNode;
  pane?: ReactNode;
};

const chatColumnWithPane =
  "w-[calc(100cqw_-_clamp(20rem,var(--right-panel-width,32.5rem),100cqw_-_20rem))]";

/** The thread screen: top bar, chat timeline and composer, with an optional pane on the right. */
export function ThreadView({
  threadId,
  rows,
  loading = false,
  topBar,
  pane,
}: ThreadViewProps) {
  return (
    <div className="@container flex h-full min-h-0 min-w-0 flex-1">
      <div
        className={cx(
          "flex h-full min-h-0 shrink-0 flex-col",
          pane === undefined ? "w-full" : chatColumnWithPane,
        )}
      >
        <AppTopBar>{topBar}</AppTopBar>
        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="relative min-h-0 flex-1">
            <JamChat
              jamId={threadId}
              rows={rows}
              initialLoading={loading}
            />
            {loading && rows.length === 0 && <ChatSkeleton />}
          </div>
          <div className="min-h-0 px-4 pb-[calc(0.25rem+var(--safe-bottom))]">
            <div className="mx-auto flex h-full min-h-0 w-full max-w-4xl flex-col justify-end">
              <Composer />
            </div>
          </div>
        </div>
      </div>
      {pane !== undefined && (
        <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
          {pane}
        </div>
      )}
    </div>
  );
}
