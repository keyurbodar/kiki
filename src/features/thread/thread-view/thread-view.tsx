import { useAtomValue } from "@effect/atom-react";
import { cx } from "class-variance-authority";
import { AsyncResult } from "effect/reactivity";
import { type ReactNode, useMemo, useState } from "react";
import { AppTopBar } from "@/components/app-top-bar";
import { Composer } from "@/components/composer";
import { threadMachinesAtom } from "@/data/atoms/setup";
import type { TimelineRow } from "@/data/events";
import {
  ComposerFooter,
  type FooterMachine,
  MachineTrigger,
  type SetupStep,
  type StatusColor,
} from "@/features/composer/composer-footer";
import { ContextMeter } from "@/features/composer/context-meter";
import {
  AttachmentSourceProvider,
  apiAttachmentSource,
  pendingAttachmentSource,
} from "@/features/thread/attachment-gallery";
import type { ClarifyAnswer } from "@/features/thread/clarify-takeover";
import {
  ComposerTakeover,
  type ComposerTakeoverProps,
  takeoverKey,
} from "@/features/thread/composer-takeover";
import { JamChat } from "@/features/thread/jam-chat";
import { useComposerSend } from "@/features/thread/use-composer-send";
import { ChatSkeleton } from "./chat-skeleton";

type ClarifyRow = Extract<TimelineRow, { type: "clarify" }>;
type EnvironmentRequestRow = Extract<
  TimelineRow,
  { type: "environment-request" }
>;

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
  loadingOlder?: boolean;
  hasOlder?: boolean;
  onLoadOlder?: () => void;
  /** The clarify card the composer answers, from the row builder. */
  pendingAsk?: ClarifyRow | undefined;
  /** The newest unfulfilled environment request, from the row builder. */
  pendingEnvironment?: EnvironmentRequestRow | undefined;
  topBar?: ReactNode;
  pane?: ReactNode;
  /** Hides the chat column so the open pane fills the panel. */
  paneExpanded?: boolean;
  /** Replaces the composer when no request is waiting on an answer. */
  composer?: ReactNode;
  /** A takeover that needs shell context (desktop, terminal, feedback, MCP setup); wins over the ones derived from rows. */
  takeover?: ComposerTakeoverProps;
};

/** The chat column beside an open pane: the container minus the pane's width, read from the token so a missing definition shows up instead of being guessed. */
const chatColumnWithPane =
  "w-[calc(100cqw_-_clamp(var(--container-xs),var(--right-panel-width),100cqw_-_var(--container-xs)))]";

type PendingRequest =
  | { kind: "clarify"; row: ClarifyRow }
  | { kind: "environment"; row: EnvironmentRequestRow };

/** Capy answers one request at a time: the newest one still waiting. */
function pendingRequest(
  ask: ClarifyRow | undefined,
  environment: EnvironmentRequestRow | undefined,
): PendingRequest | undefined {
  if (ask === undefined) {
    return environment === undefined
      ? undefined
      : { kind: "environment", row: environment };
  }
  if (environment === undefined) return { kind: "clarify", row: ask };
  return environment.createdAt >= ask.createdAt
    ? { kind: "environment", row: environment }
    : { kind: "clarify", row: ask };
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

/**
 * Capy's attachment source is mounted for the chat list and every open pane,
 * so both resolve URLs through the same API-backed provider.
 */
const attachmentSourceFor = (orgId: string | undefined, jamId: string) =>
  orgId === undefined
    ? pendingAttachmentSource
    : apiAttachmentSource(orgId, jamId);

const machineStatusColor = (state: string): StatusColor => {
  if (state === "running" || state === "online") return "success";
  if (state === "sleeping" || state === "asleep") return "neutral";
  if (state === "stopped" || state === "gone") return "danger";
  return "warning";
};

const footerMachine = (rows: readonly unknown[]): FooterMachine | null => {
  const first = rows[0];
  if (first === null || typeof first !== "object") return null;
  const row = first as Record<string, unknown>;
  const state = typeof row.state === "string" ? row.state : "";
  const isDevice = row.kind === "device";
  const name = typeof row.name === "string" ? row.name : null;
  const steps: SetupStep[] = Array.isArray(row.setupSteps)
    ? row.setupSteps.flatMap((step): SetupStep[] => {
        if (step === null || typeof step !== "object") return [];
        const item = step as Record<string, unknown>;
        const phase = item.phase;
        const status = item.status;
        if (
          phase !== "initialize" &&
          phase !== "refresh" &&
          phase !== "startup"
        )
          return [];
        if (
          status !== "not_ready" &&
          status !== "queued" &&
          status !== "running" &&
          status !== "success" &&
          status !== "error"
        )
          return [];
        return [
          {
            phase,
            status,
            repoFullName:
              typeof item.repoFullName === "string" ? item.repoFullName : null,
            startedAt:
              typeof item.startedAt === "string" ||
              typeof item.startedAt === "number"
                ? new Date(item.startedAt)
                : null,
            durationMs:
              typeof item.durationMs === "number" ? item.durationMs : null,
          },
        ];
      })
    : [];
  return {
    device:
      isDevice && name !== null
        ? {
            name,
            workspaceKind: "checkout",
            connected: true,
            isThisDevice: false,
          }
        : null,
    state,
    color: machineStatusColor(state),
    statusLabel: state === "sleeping" ? "Asleep" : state,
    detail: state === "running" || state === "online" ? null : state,
    allocation: null,
    sizeLabel: typeof row.size === "string" ? row.size : null,
    settingUp: false,
    setupDegraded: false,
    setupSteps: steps,
  };
};

export function ThreadView({
  threadId,
  rows,
  handlers,
  loading = false,
  loadingOlder = false,
  hasOlder = false,
  onLoadOlder,
  pendingAsk,
  pendingEnvironment,
  topBar,
  pane,
  paneExpanded = false,
  composer,
  takeover,
}: ThreadViewProps) {
  const submit = useComposerSend(threadId);
  const orgId = handlers.orgId;
  const machineRows = useAtomValue(
    orgId === undefined
      ? threadMachinesAtom("" as never, threadId)
      : threadMachinesAtom(orgId as never, threadId),
  );
  const machines = AsyncResult.isSuccess(machineRows)
    ? footerMachine(machineRows.value as readonly unknown[])
    : null;

  const [hidden, setHidden] = useState<ReadonlySet<string>>(
    () => new Set<string>(),
  );
  const hide = (key: string) =>
    setHidden((current) => new Set(current).add(key));

  const request =
    takeover === undefined
      ? pendingRequest(pendingAsk, pendingEnvironment)
      : undefined;
  let active: ComposerTakeoverProps | undefined = takeover;
  if (active === undefined && request !== undefined) {
    const key = takeoverKey(request.kind, request.row.id);
    if (!hidden.has(key)) {
      active = takeoverProps(request, threadId, handlers, () => hide(key));
    }
  }

  const empty = !loading && rows.length === 0;
  const attachmentSource = useMemo(
    () => attachmentSourceFor(handlers.orgId, threadId),
    [handlers.orgId, threadId],
  );

  const header = <AppTopBar>{topBar}</AppTopBar>;

  return (
    <div className="@container flex h-full min-h-0 min-w-0 flex-1">
      {!paneExpanded && (
        <div
          className={cx(
            "flex h-full min-h-0 shrink-0 flex-col",
            pane === undefined ? "w-full" : chatColumnWithPane,
          )}
        >
          {header}
          <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
            <div className="relative min-h-0 flex-1">
              <JamChat
                jamId={threadId}
                rows={rows}
                initialLoading={loading}
                onStartReached={hasOlder ? onLoadOlder : undefined}
                header={
                  loadingOlder ? (
                    <p
                      data-slot="chat-loading-older"
                      className="py-2 text-center text-xs text-muted-foreground-2"
                    >
                      Loading older messages
                    </p>
                  ) : undefined
                }
              />
              {loading && rows.length === 0 && <ChatSkeleton />}
              {empty && (
                <div
                  data-slot="thread-empty"
                  className="pointer-events-none absolute inset-0 flex items-center justify-center px-4"
                >
                  <p className="text-sm text-muted-foreground-2">
                    No messages yet
                  </p>
                </div>
              )}
            </div>
            <div className="min-h-0 px-4 pb-[calc(var(--spacing)+var(--safe-bottom))]">
              <div className="mx-auto flex h-full min-h-0 w-full max-w-4xl flex-col justify-end">
                {active === undefined ? (
                  (composer ?? <Composer onSubmit={submit} />)
                ) : (
                  <ComposerTakeover {...active} />
                )}
                <ComposerFooter
                  data-slot="composer-footer"
                  machine={<MachineTrigger machine={machines} />}
                  meter={
                    orgId === undefined ? undefined : (
                      <ContextMeter orgId={orgId} jamId={threadId} />
                    )
                  }
                />
              </div>
            </div>
          </div>
        </div>
      )}
      {pane !== undefined && (
        <AttachmentSourceProvider source={attachmentSource}>
          <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
            {paneExpanded && header}
            {pane}
          </div>
        </AttachmentSourceProvider>
      )}
    </div>
  );
}
