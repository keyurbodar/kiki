import { useAtomValue } from "@effect/atom-react";
import { useNavigate } from "@tanstack/react-router";
import { cx } from "class-variance-authority";
import { Option } from "effect";
import { AsyncResult } from "effect/reactivity";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppTopBar } from "@/components/app-top-bar";
import {
  Composer,
  type ComposerHandle,
  type ComposerPayload,
  PlusMenu,
} from "@/components/composer";
import type { ChipIssue } from "@/components/markdown-chips";
import type { OrgId } from "@/data/api/schemas/ids";
import type { IssueList } from "@/data/api/schemas/issue";
import { idleAtom } from "@/data/atoms/idle";
import { allIssuesAtom } from "@/data/atoms/issues";
import { projectsAtom } from "@/data/atoms/projects";
import { threadMachinesAtom } from "@/data/atoms/setup";
import { useThreadsAtom } from "@/data/atoms/threads";
import type { TimelineRow } from "@/data/events";
import {
  ComposerAttachments,
  useComposerAttachments,
  useFileUploader,
} from "@/features/composer/attachments";
import { composerCommands } from "@/features/composer/composer-commands";
import {
  ComposerFooter,
  type FooterMachine,
  MachineTrigger,
  type SetupStep,
  type StatusColor,
  ThreadBranchChip,
} from "@/features/composer/composer-footer";
import { ContextMeter } from "@/features/composer/context-meter";
import {
  EditBar,
  MessageQueue,
  type MessageQueueProps,
  type QueueRowData,
} from "@/features/composer/message-queue";
import { useDriveListing } from "@/features/drive/drive-detail-page/use-drive-listing";
import {
  IssueStateIcon,
  issueStatusDefaults,
} from "@/features/issues/issue-parts";
import { registerCommands } from "@/features/shell/keyboard";
import {
  AttachmentSourceProvider,
  apiAttachmentSource,
} from "@/features/thread/attachment-gallery";
import type { ClarifyAnswer } from "@/features/thread/clarify-takeover";
import {
  ComposerTakeover,
  type ComposerTakeoverProps,
  takeoverKey,
} from "@/features/thread/composer-takeover";
import {
  type ChatJump,
  JamChat,
  rowForJump,
  rowKey,
} from "@/features/thread/jam-chat";
import type { EditTarget, ReplyTarget } from "@/features/thread/message-footer";
import { type ExcerptMention, replyDraft } from "@/features/thread/reply-quote";
import { createComposerCommands } from "@/features/thread/thread-route/thread-commands";
import type { EditDraft } from "@/features/thread/timeline";
import { useComposerSend } from "@/features/thread/use-composer-send";
import { Button } from "@/primitives/button";
import { RightPanelGroup } from "@/primitives/right-panel";
import { toast } from "@/primitives/toaster";
import { ChatSkeleton } from "./chat-skeleton";
import { ThreadMessageActions } from "./message-actions";
import { threadChips } from "./thread-chips";
import { threadHeaderClassName } from "./thread-header";
import {
  skillsMentionSource,
  threadMentionSources,
} from "./thread-mention-sources";
import { ThreadModelPicker } from "./thread-model-picker";

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
  /** The history read failed: the transcript shows Capy's failure state instead of a skeleton. */
  failed?: boolean;
  onRetry?: () => void;
  loadingOlder?: boolean;
  hasOlder?: boolean;
  onLoadOlder?: () => void;
  /** The clarify card the composer answers, from the row builder. */
  pendingAsk?: ClarifyRow | undefined;
  /** The newest unfulfilled environment request, from the row builder. */
  pendingEnvironment?: EnvironmentRequestRow | undefined;
  topBar?: ReactNode;
  /** The right dock: omitted leaves the thread on its chat, as Capy does. */
  dock?: ReactNode;
  /** A pane the chat column's strip opened: it replaces the transcript. */
  mainPane?: ReactNode;
  /** Hides the chat column so the open pane fills the panel. */
  paneExpanded?: boolean;
  /** Replaces the composer when no request is waiting on an answer. */
  composer?: ReactNode;
  /** The sent message the composer is editing, from the thread's edit draft. */
  editing?: EditDraft | null;
  /** Opens the composer on a sent message. */
  onEditMessage?: (target: EditTarget) => void;
  /** Leaves edit mode without sending, restoring the draft the edit replaced. */
  onCancelEdit?: () => void;
  /** A takeover that needs shell context (desktop, terminal, feedback, MCP setup); wins over the ones derived from rows. */
  takeover?: ComposerTakeoverProps;
};

/** The chat column beside an open pane: the container minus the pane's width, read from the token so a missing definition shows up instead of being guessed. */
const chatColumnWithPane =
  "w-[calc(100cqw_-_clamp(var(--container-xs),var(--right-panel-width),100cqw_-_var(--container-xs)))]";

type PendingRequest =
  | { kind: "clarify"; row: ClarifyRow }
  | { kind: "environment"; row: EnvironmentRequestRow };

/** The composer shows no queue of its own here: queued sends live in the timeline. */
const noQueuedMessages: ReadonlyArray<QueueRowData> = [];
const noQueueActions: MessageQueueProps["actions"] = {
  departing: new Map(),
  act: () => Promise.resolve(false),
};

/** The reply a message put in the draft: the bar above the composer reads it, Cancel takes the excerpt back out. */
type Replying = { name: string; text: string; excerpt: ExcerptMention };

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
  apiAttachmentSource(orgId, jamId);

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
  failed = false,
  onRetry,
  loadingOlder = false,
  hasOlder = false,
  onLoadOlder,
  pendingAsk,
  pendingEnvironment,
  topBar,
  dock,
  mainPane,
  paneExpanded = false,
  composer,
  editing,
  onEditMessage,
  onCancelEdit,
  takeover,
}: ThreadViewProps) {
  const composerHandle = useRef<ComposerHandle | null>(null);
  useEffect(
    () =>
      registerCommands(
        createComposerCommands(() => ({
          focus: () => composerHandle.current?.focus(),
        })),
        { capture: true },
      ),
    [],
  );
  const send = useComposerSend(threadId, editing?.eventId, (payload) =>
    composerHandle.current?.reset(payload),
  );
  const [jump, setJump] = useState<ChatJump | undefined>(undefined);
  const jumpCount = useRef(0);
  const jumpToSection = useCallback(
    (rowId: string, section: number) => {
      const row = rowForJump(rows, rowId);
      if (row === undefined) return;
      jumpCount.current += 1;
      setJump({
        rowKey: rowKey(row),
        section,
        index: rows.indexOf(row),
        request: jumpCount.current,
      });
    },
    [rows],
  );
  const draft = editing ?? undefined;

  useEffect(() => {
    if (draft === undefined) return;
    composerHandle.current?.reset({
      text: draft.text,
      mentions: [],
      files: [],
    });
    composerHandle.current?.focus();
  }, [draft]);

  const cancelEdit = useCallback(() => {
    composerHandle.current?.reset(null);
    onCancelEdit?.();
  }, [onCancelEdit]);

  // The bar and the truncation read one draft: while it exists, Escape leaves
  // edit mode wherever the keystroke lands, so the bar is never the only way out.
  useEffect(() => {
    if (draft === undefined) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      event.preventDefault();
      cancelEdit();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [draft, cancelEdit]);

  const [replying, setReplying] = useState<Replying | null>(null);

  const startReply = useCallback((target: ReplyTarget) => {
    const composer = composerHandle.current;
    if (composer === null) return;
    const { draft: next, excerpt } = replyDraft(composer.getPayload(), target);
    composer.focus();
    composer.reset(next);
    setReplying({ name: target.name, text: target.text, excerpt });
  }, []);

  const cancelReply = useCallback(() => {
    const composer = composerHandle.current;
    const payload = composer?.getPayload();
    if (composer !== null && payload !== undefined && replying !== null) {
      const rest = payload.text.slice(replying.excerpt.end).replace(/^\n+/, "");
      const shift = payload.text.length - rest.length;
      composer.reset({
        text: rest,
        mentions: payload.mentions
          .filter((mention) => mention.id !== replying.excerpt.id)
          .map((mention) => ({
            ...mention,
            start: mention.start - shift,
            end: mention.end - shift,
          })),
        files: payload.files,
        caret: null,
      });
    }
    setReplying(null);
  }, [replying]);

  const editedRowIds = useMemo(() => {
    const edited = new Set<string>();
    for (const row of rows)
      if (row.type === "user-message" && row.editOf !== undefined)
        edited.add(row.id);
    return edited;
  }, [rows]);
  const orgId = handlers.orgId;
  const orgThreads = useAtomValue(useThreadsAtom(orgId as OrgId | undefined));
  const drive = useDriveListing(orgId, {});
  const skills = useMemo(
    () =>
      skillsMentionSource(
        (drive.listing?.entries ?? []).map((entry) => entry.path),
      ),
    [drive.listing],
  );
  const mentionSources = useMemo(
    () => [
      ...threadMentionSources(
        Option.getOrUndefined(AsyncResult.value(orgThreads))?.items ?? [],
        threadId,
      ),
      ...(skills === undefined ? [] : [skills]),
    ],
    [orgThreads, threadId, skills],
  );
  const projects = useAtomValue(
    orgId === undefined
      ? idleAtom<ReadonlyArray<{ id: string; code: string }>>()
      : projectsAtom(orgId as OrgId),
  );
  const orgIssues = useAtomValue(
    orgId === undefined ? idleAtom<IssueList>() : allIssuesAtom(orgId as OrgId),
  );
  const chips = useMemo(() => {
    const codes = new Map<string, string>();
    for (const project of Option.getOrUndefined(AsyncResult.value(projects)) ??
      [])
      codes.set(project.id, project.code);
    return threadChips({
      threads:
        Option.getOrUndefined(AsyncResult.value(orgThreads))?.items ?? [],
      projectCodes: codes,
      currentThreadId: threadId,
      issues: Option.getOrUndefined(AsyncResult.value(orgIssues))?.issues ?? [],
    });
  }, [orgIssues, projects, orgThreads, threadId]);
  const chipValue = useMemo(
    () => ({
      ...chips,
      renderIssueState: (issue: ChipIssue, className: string) => (
        <IssueStateIcon
          {...issueStatusDefaults[issue.status]}
          className={className}
        />
      ),
    }),
    [chips],
  );
  const navigate = useNavigate();
  const commands = useMemo(
    () => composerCommands({ newThread: () => void navigate({ to: "/new" }) }),
    [navigate],
  );
  const attachments = useComposerAttachments(
    useFileUploader(orgId as OrgId | undefined),
  );
  const submit = (payload: ComposerPayload) => {
    if (!send(payload)) return false;
    attachments.clearSent();
    setReplying(null);
    return true;
  };
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

  // Capy defers a request without losing it: Later hides the takeover, the
  // composer comes back, and a lozenge in its footer reopens the request.
  const deferred =
    request !== undefined &&
    hidden.has(takeoverKey(request.kind, request.row.id))
      ? request
      : undefined;
  const show = (key: string) =>
    setHidden((current) => {
      const next = new Set(current);
      next.delete(key);
      return next;
    });

  const empty = !loading && !failed && rows.length === 0;
  const attachmentSource = useMemo(
    () => attachmentSourceFor(handlers.orgId, threadId),
    [handlers.orgId, threadId],
  );

  const header = topBar ?? <AppTopBar className={threadHeaderClassName} />;

  return (
    <ThreadMessageActions
      orgId={handlers.orgId}
      jamId={threadId}
      reply={startReply}
      editMessage={onEditMessage}
      editedRowIds={editedRowIds}
      jumpToSection={jumpToSection}
    >
      <RightPanelGroup className="@container min-w-0 flex-1">
        {/* Capy expands only when a second pane is open: with the chat alone the
            expanded branch has nothing to fill and would empty the panel. */}
        {(dock === undefined || !paneExpanded) && (
          <div
            className={cx(
              "flex h-full min-h-0 shrink-0 flex-col",
              dock === undefined ? "w-full" : chatColumnWithPane,
            )}
          >
            {header}
            {mainPane ?? (
              <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
                <div className="relative min-h-0 flex-1">
                  <JamChat
                    jamId={threadId}
                    chips={chipValue}
                    rows={rows}
                    initialLoading={loading}
                    onStartReached={hasOlder ? onLoadOlder : undefined}
                    onInsertQuote={(mention) =>
                      composerHandle.current?.insertMention(mention, "")
                    }
                    jump={jump}
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
                  {failed && rows.length === 0 && (
                    <div
                      data-slot="thread-load-failed"
                      className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-4 text-center"
                    >
                      <span className="text-sm text-muted-foreground-1">
                        Couldn't load this conversation
                      </span>
                      <Button onClick={onRetry}>Retry</Button>
                    </div>
                  )}
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
                    {deferred !== undefined && (
                      <Button
                        data-slot="deferred-request"
                        variant="ghost"
                        size="xs"
                        onClick={() =>
                          show(takeoverKey(deferred.kind, deferred.row.id))
                        }
                      >
                        {deferred.kind === "environment"
                          ? "Add variables"
                          : "Answer questions"}
                      </Button>
                    )}
                    {draft !== undefined && <EditBar onCancel={cancelEdit} />}
                    {active === undefined || draft !== undefined ? (
                      (composer ?? (
                        <MessageQueue
                          rows={noQueuedMessages}
                          actions={noQueueActions}
                          replying={
                            replying === null
                              ? undefined
                              : {
                                  name: replying.name,
                                  text: replying.text,
                                  onCancel: cancelReply,
                                }
                          }
                        >
                          <Composer
                            ref={composerHandle}
                            onSubmit={submit}
                            onFilesAdded={attachments.add}
                            attachments={
                              <ComposerAttachments attachments={attachments} />
                            }
                            hasAttachments={attachments.entries.length > 0}
                            uploading={attachments.uploading}
                            defaultValue={
                              draft === undefined
                                ? undefined
                                : { text: draft.text, mentions: [], files: [] }
                            }
                            autoFocus={draft !== undefined}
                            sources={mentionSources}
                            commands={commands}
                            submitLabel="Send"
                            submitPersistent
                            leftControls={
                              <>
                                <PlusMenu
                                  sources={mentionSources}
                                  onAttach={attachments.add}
                                  onPickCategory={(category) =>
                                    composerHandle.current?.typeCharacter(
                                      `@${category}:`,
                                    )
                                  }
                                />
                                {orgId === undefined ? null : (
                                  <ThreadModelPicker
                                    orgId={orgId}
                                    jamId={threadId}
                                  />
                                )}
                              </>
                            }
                          />
                        </MessageQueue>
                      ))
                    ) : (
                      <ComposerTakeover {...active} />
                    )}
                    {/*
                      An edit draft outranks a takeover: the timeline truncates
                      from the edited message, so the editor has to be the thing
                      on screen or the conversation collapses with no way back.
                      Cancelling or sending the edit returns the takeover.
                    */}
                    <ComposerFooter
                      data-slot="composer-footer"
                      machine={<MachineTrigger machine={machines} />}
                      branch={
                        orgId === undefined ? undefined : (
                          <ThreadBranchChip
                            orgId={orgId}
                            jamId={threadId}
                            onCopied={(branch) =>
                              toast.success("Copied", { description: branch })
                            }
                          />
                        )
                      }
                      meter={
                        orgId === undefined ? undefined : (
                          <ContextMeter orgId={orgId} jamId={threadId} />
                        )
                      }
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        {dock !== undefined && (
          <AttachmentSourceProvider source={attachmentSource}>
            {dock}
          </AttachmentSourceProvider>
        )}
      </RightPanelGroup>
    </ThreadMessageActions>
  );
}
