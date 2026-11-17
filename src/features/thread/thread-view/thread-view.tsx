import { cx } from "class-variance-authority";
import { type ReactNode, useState } from "react";
import { AppTopBar } from "@/components/app-top-bar";
import { Composer } from "@/components/composer";
import type { TimelineRow } from "@/data/events";
import type { ClarifyAnswer } from "@/features/thread/clarify-takeover";
import {
  ComposerTakeover,
  type ComposerTakeoverProps,
  pendingClarify,
  pendingEnvironmentRequest,
  takeoverKey,
} from "@/features/thread/composer-takeover";
import { JamChat } from "@/features/thread/jam-chat";
import { ChatSkeleton } from "./chat-skeleton";

export type ThreadTakeoverHandlers = {
  orgId?: string | undefined;
  parentJamId?: string | null;
  onClarifySubmit: (answers: ReadonlyArray<ClarifyAnswer>) => void;
};

export type ThreadViewProps = {
  threadId: string;
  rows: readonly TimelineRow[];
  /** Where answers and dismissals go; the view owns the local dismissal state. */
  handlers: ThreadTakeoverHandlers;
  loading?: boolean;
  topBar?: ReactNode;
  pane?: ReactNode;
  /** Replaces the composer when no request is waiting on an answer. */
  composer?: ReactNode;
  /** A takeover that needs shell context (desktop, terminal, feedback, MCP setup); wins over the ones derived from rows. */
  takeover?: ComposerTakeoverProps;
};

const chatColumnWithPane =
  "w-[calc(100cqw_-_clamp(var(--container-xs),var(--right-panel-width,calc(var(--spacing)*130)),100cqw_-_var(--container-xs)))]";

type PendingRequest =
  | { kind: "clarify"; row: Extract<TimelineRow, { type: "clarify" }> }
  | {
      kind: "environment";
      row: Extract<TimelineRow, { type: "environment-request" }>;
    };

/** The newest request still waiting on the person, oldest unsolved request first in Capy. */
function pendingRequest(
  rows: readonly TimelineRow[],
): PendingRequest | undefined {
  const clarify = pendingClarify(rows);
  const environment = pendingEnvironmentRequest(rows);
  if (clarify === undefined) {
    return environment === undefined
      ? undefined
      : { kind: "environment", row: environment };
  }
  if (environment === undefined) return { kind: "clarify", row: clarify };
  return environment.createdAt >= clarify.createdAt
    ? { kind: "environment", row: environment }
    : { kind: "clarify", row: clarify };
}

function takeoverProps(
  request: PendingRequest,
  threadId: string,
  handlers: ThreadTakeoverHandlers,
  hide: () => void,
): ComposerTakeoverProps {
  switch (request.kind) {
    case "clarify":
      return {
        kind: "clarify",
        questions: request.row.questions,
        onSubmit: (answers) => handlers.onClarifySubmit(answers),
        onLater: hide,
        onDismiss: hide,
      };
    case "environment":
      return {
        kind: "environment",
        orgId: handlers.orgId,
        jamId: threadId,
        parentJamId: handlers.parentJamId ?? null,
        entry: request.row,
        onLater: hide,
        onDismiss: hide,
      };
  }
}

/** The thread screen: top bar, chat timeline and composer, with an optional pane on the right. */
export function ThreadView({
  threadId,
  rows,
  handlers,
  loading = false,
  topBar,
  pane,
  composer,
  takeover,
}: ThreadViewProps) {
  const [hidden, setHidden] = useState<ReadonlySet<string>>(
    () => new Set<string>(),
  );
  const hide = (key: string) =>
    setHidden((current) => new Set(current).add(key));

  const request = takeover === undefined ? pendingRequest(rows) : undefined;
  let active: ComposerTakeoverProps | undefined = takeover;
  if (active === undefined && request !== undefined) {
    const key = takeoverKey(request.kind, request.row.id);
    if (!hidden.has(key)) {
      active = takeoverProps(request, threadId, handlers, () => hide(key));
    }
  }

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
            <JamChat jamId={threadId} rows={rows} initialLoading={loading} />
            {loading && rows.length === 0 && <ChatSkeleton />}
          </div>
          <div className="min-h-0 px-4 pb-[calc(var(--spacing)+var(--safe-bottom))]">
            <div className="mx-auto flex h-full min-h-0 w-full max-w-4xl flex-col justify-end">
              {active === undefined ? (
                (composer ?? <Composer />)
              ) : (
                <ComposerTakeover {...active} />
              )}
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
