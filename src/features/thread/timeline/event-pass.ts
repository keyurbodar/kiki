import type { EventId, EventRow, JamId, ToolCallId } from "@/data/events";
import { NOTIFICATION_KEYS } from "@/data/events";
import {
  accessLabel,
  connectionLabel,
  driveNotice,
  environmentLabel,
  formatCompact,
  formatDuration,
  formatSpan,
  handoffFailureLabel,
  modelName,
  UNSUPPORTED_LABEL,
  wireDroppedLabel,
} from "./labels";
import {
  asRecord,
  CARD_TOOLS,
  CLARIFY_TOOL,
  DESKTOP_REQUEST_TOOL,
  deliveryState,
  ENV_REQUEST_TOOL,
  executeData,
  HIDDEN_SUFFIX,
  HIDDEN_TOOLS,
  isDeliveryTool,
  isFinalSlackReact,
  isTool,
  isWaitTool,
  joinText,
  MACHINE_TOOLS,
  MCP_TOOLS,
  type ReasoningRow,
  type Row,
  readArray,
  readNumber,
  readString,
  type Settlement,
  settledAt,
  TERMINAL_REQUEST_TOOL,
  unwrapToolCall,
} from "./shared";

type Event = EventRow;
type EventOf<K extends Event["kind"]> = Extract<Event, { kind: K }>;
type Block = EventOf<"assistant">["payload"]["blocks"][number];
type Notification = EventOf<"notification">;

export type DeliveryTool = "message_user" | "message_agent";

export interface EventPass {
  readonly ordered: ReadonlyArray<Event>;
  readonly entries: ReadonlyArray<Row>;
  readonly settledTimeline: ReadonlyArray<Row>;
  readonly openTurnId: EventId | undefined;
  readonly callIds: ReadonlySet<string>;
}

/**
 * Sorts events by id, then moves each assistant event that interrupted an
 * earlier exchange to just before the event it names in
 * `interruption.beforeEventId`.
 */
export const orderEvents = (
  events: ReadonlyArray<Event>,
): ReadonlyArray<Event> => {
  const sorted = [...events].sort((a, b) =>
    a.id < b.id ? -1 : +(a.id > b.id),
  );
  const moved = sorted
    .flatMap((event) => {
      const boundary =
        event.kind === "assistant"
          ? event.payload.interruption?.beforeEventId
          : undefined;
      return boundary !== undefined && boundary < event.id
        ? [{ event, boundary }]
        : [];
    })
    .sort((a, b) =>
      a.boundary === b.boundary
        ? a.event.id < b.event.id
          ? -1
          : 1
        : a.boundary < b.boundary
          ? -1
          : 1,
    );
  if (moved.length === 0) return sorted;
  const movedIds = new Set(moved.map(({ event }) => event.id));
  const out: Event[] = [];
  let index = 0;
  for (const event of sorted) {
    if (movedIds.has(event.id)) continue;
    let next = moved[index];
    while (next !== undefined && next.boundary <= event.id) {
      out.push(next.event);
      index += 1;
      next = moved[index];
    }
    out.push(event);
  }
  return [...out, ...moved.slice(index).map(({ event }) => event)];
};

const notificationCategory: Record<string, string> = {
  auto_cancelled_background_ops: "internal",
  chrome_removed: "warning",
  ci_incomplete: "notice",
  ci_no_checks: "notice",
  ci_result: "notice",
  compact: "internal",
  compaction_failed: "warning",
  connection_changed: "warning",
  credits_answered: "credits",
  credits_waiting: "credits",
  crew_credits_answered: "crew_credits",
  crew_credits_ask: "crew_credits",
  "crew.joined": "crew",
  "crew.left": "crew",
  "crew.released": "crew",
  "crew.taken": "crew",
  delivery_reminder: "internal",
  desktop_request_done: "notice",
  desktop_request_expired: "notice",
  drive_bulk_delete: "warning",
  drive_remounted: "internal",
  drive_unmounted: "warning",
  terminal_request_done: "notice",
  environment_variables_updated: "environment",
  feedback_request_decided: "internal",
  files_copied: "notice",
  github_subscription_event: "notice",
  handoff: "internal",
  input_batch: "internal",
  issue_activity: "notice",
  issues_switched: "issues",
  machine_recovered: "warning",
  machine_secrets_missing: "warning",
  machine_secrets_restored: "warning",
  machine_server_outdated: "warning",
  machine_trouble: "warning",
  machine_unavailable: "warning",
  mcp_setup_updated: "internal",
  permission_decided: "permission",
  request_dismissed: "internal",
  request_reopened: "internal",
  phone_attached: "notice",
  pr_closed: "notice",
  pr_conflict: "notice",
  pr_feedback: "notice",
  pr_merged: "notice",
  reasoning_continuation: "internal",
  review_completion: "review",
  review_failed: "notice",
  review_submission: "internal",
  setup_failed: "setup",
  setup_recovered: "setup",
  slack_files_dropped: "warning",
  slack_subscription_message: "notice",
  startup_settled: "internal",
  stop_cancelled_ops: "internal",
  subagent_credits_answered: "subagent_credits",
  subagent_credits_ask: "subagent_credits",
  task_completion: "internal",
  thread_completion: "internal",
  unreported_waits: "internal",
  unwaited_background_ops: "internal",
  user_attachment_saved: "notice",
  user_file_saved: "notice",
  volume_conflict: "internal",
  volume_quota: "warning",
  webhook_subscription_request: "notice",
  week_without_check_in: "internal",
  workspace_degraded: "setup",
  workspace_replaced: "warning",
  workspace_restored: "warning",
};
const internalKeys = new Set([
  "turn_interrupted",
  "turn_aborted",
  "local_command",
  "bridge_status",
]);
const knownKeys: ReadonlySet<string> = new Set(NOTIFICATION_KEYS);
const categoryOf = (key: string) =>
  knownKeys.has(key)
    ? (notificationCategory[key] ?? "notice")
    : internalKeys.has(key)
      ? "internal"
      : "notice";

const machineKeys = new Set([
  "machine_recovered",
  "machine_trouble",
  "machine_unavailable",
  "workspace_replaced",
  "workspace_restored",
]);
const driveKeys = new Set([
  "volume_quota",
  "drive_unmounted",
  "drive_bulk_delete",
]);
const crewMarkers: Record<string, { label: string; leads: boolean }> = {
  "crew.taken": { label: "joined the crew", leads: true },
  "crew.released": { label: "left the crew", leads: true },
  "crew.joined": { label: "Joined the crew of", leads: false },
  "crew.left": { label: "Left the crew of", leads: false },
};
const machineTrouble = {
  start: {
    code: "machine_not_starting",
    message: "Capy is still trying to start your machine",
  },
  reach: {
    code: "machine_not_responding",
    message: "Capy is still trying to reconnect to your machine",
  },
  wedged: {
    code: "machine_not_responding",
    message: "Capy is still trying to reconnect to your machine",
  },
} as const;
const capacityTrouble = {
  code: "machine_waiting_for_capacity",
  message:
    "The sandbox fleet is full, so Capy keeps retrying your machine as room frees up",
};
const creditsOutcome = (waited: boolean, decision: string) =>
  decision === "use"
    ? "used"
    : waited
      ? "waited"
      : decision === "ask" || decision === "answered"
        ? "answered"
        : "retried";
const continuingOn = /^Continuing on (.+)$/;
const watchPrefixes = ["pull:", "slack:", "slack_reply_"];
const parkCodes = new Set(["device_offline", "handoff_in_progress"]);
const isParkCall = (toolCallId: string) =>
  toolCallId.startsWith("devpark_") || toolCallId.startsWith("handoff_");
const interruptedTexts = new Set([
  "[Request interrupted by user for tool use]",
  "[Tool call lost: the worker running it stopped before its result was recorded; nobody interrupted it. It may have partly run, so check its effects before retrying it.]",
]);
const REASONING_CONTINUATION = "reasoning_continuation";
const DELIVERY_REMINDER = "delivery_reminder";
const CODEX_CONTINUATIONS = 4;
const ANTHROPIC_CONTINUATIONS = 2;
const GROK_CONTINUATIONS = 2;
const DELIVERY_REMINDERS = 2;
const isGrok = (modelId: string) =>
  modelId.split("/")[1]?.startsWith("grok-") === true;
const hasProgress = (block: Block) =>
  (block.type === "text" && block.text.trim().length > 0) ||
  block.type === "tool_use" ||
  block.type === "interrupted_reply";

const sameOrigin = (a: Origin, b: Origin) => {
  if (a.type !== b.type) return false;
  switch (b.type) {
    case "slack":
      return (
        a.type === "slack" &&
        a.teamId === b.teamId &&
        a.channelId === b.channelId
      );
    case "linear":
      return a.type === "linear" && a.agentSessionId === b.agentSessionId;
    case "automation":
      return a.type === "automation" && a.automationId === b.automationId;
    default:
      return true;
  }
};
type Origin = EventOf<"message">["payload"]["origin"];

/** Merges consecutive reasoning lines and times each one. */
export const mergeReasoning = (rows: ReadonlyArray<Row>): Row[] => {
  const out: Row[] = [];
  let lastAt: Date | undefined;
  let started: Date | undefined;
  for (const row of rows) {
    if (row.type === "activity" && row.kind === "reasoning") {
      const previous = out.at(-1);
      if (previous?.type === "activity" && previous.kind === "reasoning") {
        out[out.length - 1] = {
          ...previous,
          createdAt: row.createdAt,
          text: joinText(previous.text, row.text),
          elapsedMs:
            started === undefined
              ? 0
              : Math.max(0, row.createdAt.getTime() - started.getTime()),
        };
        lastAt = row.createdAt;
        continue;
      }
      started = row.startedAt ?? lastAt;
      out.push({
        ...row,
        elapsedMs:
          started === undefined
            ? 0
            : Math.max(0, row.createdAt.getTime() - started.getTime()),
      });
      lastAt = row.createdAt;
    } else {
      out.push(row);
      lastAt = settledAt(row);
    }
  }
  return out;
};

interface BlockContext {
  readonly eventId: EventId;
  readonly createdAt: Date;
  readonly startedAt: Date | undefined;
  readonly modelId: string;
  readonly reasoningMode: EventOf<"assistant">["payload"]["model"]["reasoningMode"];
  readonly mode: "fast" | "pro" | undefined;
  readonly exchangeEventId: EventId | undefined;
  readonly turnOpen: boolean;
  readonly turnCloses: boolean;
  readonly settlements: ReadonlyMap<string, Settlement>;
  readonly waitResolutions: ReadonlyMap<string, Date>;
  readonly setupNotificationEventId: EventId | undefined;
  readonly eventPosition: number;
  readonly environmentUpdates: ReadonlyArray<EnvironmentUpdate>;
  readonly desktopRequests: ReadonlyMap<string, "done" | "expired">;
  readonly replyIds: ReadonlyArray<EventId>;
  readonly terminalRequests: TerminalRequests;
  readonly feedbackRequests: ReadonlyMap<string, "sent" | "declined">;
}

interface EnvironmentUpdate {
  readonly position: number;
  readonly requestToolCallId: string | undefined;
  readonly variables: ReadonlySet<string>;
}

interface TerminalRequests {
  readonly settled: ReadonlyMap<string, boolean>;
  readonly completions: ReadonlyMap<
    string,
    { readonly isError: boolean; readonly exitCode: number | undefined }
  >;
  readonly done: ReadonlySet<string>;
  readonly cancelled: ReadonlySet<string>;
}

const clarifyQuestions = (args: unknown) =>
  readArray(args, "questions").flatMap((entry) => {
    const question = readString(entry, "question");
    const options = asRecord(entry).options;
    return question === undefined || !Array.isArray(options)
      ? []
      : [
          {
            question,
            options: options.filter(
              (option): option is string =>
                typeof option === "string" && option.length > 0,
            ),
            multiSelect: asRecord(entry).multi_select === true,
          },
        ];
  });

const environmentRequest = (args: unknown, toolCallId: ToolCallId) => {
  const variables = readArray(args, "variables").filter(
    (name): name is string => typeof name === "string" && name.length > 0,
  );
  const reason = readString(args, "reason");
  return variables.length === 0 || reason === undefined
    ? undefined
    : { toolCallId, variables, reason };
};

const fileEntries = (entries: ReadonlyArray<unknown>) =>
  entries.flatMap((entry) => {
    const file = asRecord(entry).file;
    const fileId = readString(file, "fileId");
    const name = readString(file, "name");
    const mediaType = readString(file, "mediaType");
    return fileId === undefined || name === undefined || mediaType === undefined
      ? []
      : [
          {
            file: {
              fileId,
              name,
              mediaType,
              sizeBytes: readNumber(file, "sizeBytes") ?? 0,
              sourcePath: readString(file, "sourcePath"),
            },
            title: readString(entry, "title"),
          },
        ];
  });

const embedsPath = (path: string, text: string) =>
  RegExp(
    `!\\[[^\\]]*\\]\\(\\s*<?${path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}>?[\\s)]`,
  ).test(text);

const placingFiles = (args: unknown, text: string) =>
  readArray(args, "files").flatMap((entry, index) => {
    const path = readString(entry, "path");
    return path === undefined || !embedsPath(path, text)
      ? []
      : [{ ref: path, index }];
  });

const uploadFiles = (args: unknown, text: string) =>
  readArray(args, "files").flatMap((entry, index) => {
    const path = readString(entry, "path");
    return path === undefined || embedsPath(path, text)
      ? []
      : [
          {
            index,
            path,
            name: path.replace(/\/+$/, "").split("/").at(-1) || path,
            title: readString(entry, "title"),
          },
        ];
  });

/** Proposal an MCP tool's successful result carries for the setup card. */
const mcpProposal = (toolName: string, data: unknown) =>
  MCP_TOOLS.has(toolName) && asRecord(data).setup !== undefined
    ? asRecord(data).setup
    : undefined;

const toolPhase = (settlement: Settlement | undefined) =>
  settlement === undefined ? "running" : settlement.isError ? "failed" : "done";

const executeCompletions = (
  toolCallId: string,
  settlement: Settlement | undefined,
  settlements: ReadonlyMap<string, Settlement>,
) => {
  const completions = new Map(
    (executeData(settlement?.data)?.calls ?? []).flatMap((_, index) => {
      const completion = settlements.get(`${toolCallId}:${index + 1}`);
      return completion === undefined ? [] : [[index, completion] as const];
    }),
  );
  return completions.size === 0 ? undefined : completions;
};

/** One assistant block to its rows. */
const blockRows = (block: Block, context: BlockContext): Row[] => {
  const base = {
    eventId: context.eventId,
    createdAt: context.createdAt,
    startedAt: context.startedAt,
    turnOpen: context.turnOpen,
    turnCloses: context.turnCloses,
  };
  switch (block.type) {
    case "text":
      return block.text.length === 0
        ? []
        : [
            {
              ...base,
              turnOpen: false,
              type: "activity",
              kind: "text",
              id: block.id,
              text: block.text,
            },
          ];
    case "thinking":
      return [
        {
          ...base,
          turnOpen: false,
          turnCloses: false,
          type: "activity",
          kind: "reasoning",
          id: block.id,
          text: block.text,
          presentation: block.presentation,
          elapsedMs: 0,
        },
      ];
    case "fallback":
      return block.trigger?.type === "refusal" &&
        block.fromModel !== undefined &&
        block.toModel !== undefined
        ? [
            {
              type: "error",
              severity: "warning",
              id: `${context.eventId}:${block.id}`,
              eventId: context.eventId,
              createdAt: context.createdAt,
              code: "refusal_fallback",
              message: `Anthropic declined this request, rerouted from ${block.fromModel} to ${block.toModel}`,
              retryable: false,
              data: {
                provider: block.provider,
                fromModel: block.fromModel,
                toModel: block.toModel,
                category: block.trigger.category,
              },
            },
          ]
        : [
            {
              ...base,
              type: "activity",
              kind: "fallback",
              id: block.id,
              provider: block.provider,
              fromModel: block.fromModel,
              toModel: block.toModel,
            },
          ];
    case "interrupted_reply":
      return [
        {
          type: "agent-message",
          id: block.id,
          eventId: context.eventId,
          createdAt: context.createdAt,
          startedAt: context.startedAt,
          settled: false,
          interrupted: true,
          turnCloses: true,
          text: block.text,
          files: [],
          uploads: [],
          placed: [],
          placing: [],
          modelId: context.modelId,
          reasoningMode: context.reasoningMode,
          mode: context.mode,
          exchangeEventId: context.exchangeEventId,
        },
      ];
    case "tool_use":
      return toolUseRows(block, context, base);
    default:
      return [];
  }
};

const toolUseRows = (
  block: Extract<Block, { type: "tool_use" }>,
  context: BlockContext,
  base: {
    eventId: EventId;
    createdAt: Date;
    startedAt: Date | undefined;
    turnOpen: boolean;
    turnCloses: boolean;
  },
): Row[] => {
  const { toolName, args } = unwrapToolCall(block.toolName, block.args);
  if (HIDDEN_TOOLS.has(toolName)) return [];
  const toolCallId = block.toolCallId;
  const result = context.settlements.get(toolCallId);
  const line = (ask?: Extract<Row, { kind: "tool" }>["ask"]): Row => ({
    ...base,
    turnCloses: false,
    type: "activity",
    kind: "tool",
    id: toolCallId,
    toolName,
    args,
    phase: toolPhase(result),
    result,
    ask,
  });
  const repliedPast = (eventId: EventId) =>
    context.replyIds.some((id) => id > eventId);

  if (toolName === "report_feedback" && result?.isError === false) {
    const outcome = context.feedbackRequests.get(toolCallId);
    return outcome === undefined
      ? [
          line("waiting"),
          {
            type: "feedback-request",
            id: toolCallId,
            eventId: context.eventId,
            createdAt: result.settledAt,
            toolCallId,
            assistantEventId: context.eventId,
            turnCloses: context.turnCloses,
          },
        ]
      : [line(outcome)];
  }
  if (
    toolName === "explore_suggest" &&
    result?.isError === false &&
    !repliedPast(context.eventId)
  )
    return [line("waiting")];
  if (toolName === CLARIFY_TOOL && result?.isError !== true) {
    const questions = clarifyQuestions(args);
    if (questions.length > 0)
      return [
        line(repliedPast(context.eventId) ? "answered" : "waiting"),
        {
          type: "clarify",
          id: toolCallId,
          eventId: context.eventId,
          createdAt: result?.settledAt ?? context.createdAt,
          turnCloses: context.turnCloses,
          questions,
        },
      ];
  }
  if (toolName === ENV_REQUEST_TOOL && result?.isError !== true) {
    const request = environmentRequest(args, toolCallId);
    if (request !== undefined) {
      const fulfilled = context.environmentUpdates.some(
        (update) =>
          update.position > context.eventPosition &&
          (update.requestToolCallId === toolCallId ||
            request.variables.every((name) => update.variables.has(name))),
      );
      return [
        line(fulfilled ? "added" : "waiting"),
        {
          type: "environment-request",
          id: toolCallId,
          eventId: context.eventId,
          createdAt: result?.settledAt ?? context.createdAt,
          turnCloses: context.turnCloses,
          request,
          fulfilled,
          repliedPast: repliedPast(context.eventId),
        },
      ];
    }
  }
  if (toolName === DESKTOP_REQUEST_TOOL && result?.isError === false) {
    const reason = readString(args, "reason");
    const machineId = readString(result.data, "machine_id");
    if (reason !== undefined && machineId !== undefined) {
      const state = context.desktopRequests.get(toolCallId) ?? "pending";
      return [
        line(state === "pending" ? "waiting" : state),
        {
          type: "desktop-request",
          id: toolCallId,
          eventId: context.eventId,
          createdAt: result.settledAt,
          turnCloses: context.turnCloses,
          toolCallId,
          assistantEventId: context.eventId,
          reason,
          machine: {
            machineId: machineId as never,
            jamId: readString(result.data, "jam_id") as JamId | undefined,
          },
          screenshot: asRecord(result.data).screenshot,
          state,
          repliedPast: repliedPast(result.eventId ?? context.eventId),
        },
      ];
    }
  }
  if (
    toolName === TERMINAL_REQUEST_TOOL &&
    result !== undefined &&
    context.terminalRequests.settled.get(toolCallId) === false
  ) {
    const command = readString(args, "command");
    const reason = readString(args, "reason");
    const machineId = readString(result.data, "machine_id");
    const operationId = readString(result.data, "operation_id");
    if (
      command !== undefined &&
      reason !== undefined &&
      machineId !== undefined &&
      operationId !== undefined
    ) {
      const requests = context.terminalRequests;
      const completion = requests.completions.get(toolCallId);
      const terminal =
        completion === undefined
          ? requests.cancelled.has(operationId)
            ? ({ outcome: "cancelled" } as const)
            : requests.done.has(toolCallId)
              ? ({ outcome: "done" } as const)
              : undefined
          : completion.isError
            ? ({
                outcome: completion.exitCode === -1 ? "expired" : "failed",
              } as const)
            : ({ outcome: "exited", exitCode: completion.exitCode } as const);
      if (terminal === undefined)
        return [
          line("waiting"),
          {
            type: "terminal-request",
            id: toolCallId,
            eventId: context.eventId,
            createdAt: result.settledAt,
            turnCloses: context.turnCloses,
            toolCallId,
            assistantEventId: context.eventId,
            command,
            reason,
            machine: {
              machineId: machineId as never,
              jamId: readString(result.data, "jam_id") as JamId | undefined,
            },
            operationId: operationId as never,
            repliedPast: repliedPast(result.eventId ?? context.eventId),
          },
        ];
      const settled = line(
        terminal.outcome === "done" || terminal.outcome === "expired"
          ? terminal.outcome
          : undefined,
      );
      return [
        {
          ...settled,
          phase: terminal.outcome === "failed" ? "failed" : "done",
          terminal,
        } as Row,
      ];
    }
  }
  if (result?.isError === false && result.eventId !== undefined) {
    const proposal = mcpProposal(toolName, result.data);
    if (proposal !== undefined)
      return [
        {
          type: "mcp-setup",
          id: toolCallId,
          eventId: context.eventId,
          createdAt: result.settledAt,
          turnCloses: context.turnCloses,
          assistantEventId: context.eventId,
          toolResultEventId: result.eventId,
          toolCallId,
          proposal,
          notificationEventId: context.setupNotificationEventId,
        },
      ];
  }
  if (isDeliveryTool(toolName, args)) {
    const text = readString(args, "text");
    const interrupted =
      result?.isError === true &&
      result.blocks.some(
        (part) => part.type === "text" && interruptedTexts.has(part.text),
      );
    if (text === undefined || (result?.isError === true && !interrupted))
      return [];
    const data = asRecord(result?.data);
    const delivered = Array.isArray(data.delivered)
      ? fileEntries(data.delivered)
      : [];
    return [
      {
        type: "agent-message",
        id: toolCallId,
        eventId: context.eventId,
        createdAt: interrupted
          ? context.createdAt
          : (result?.settledAt ?? context.createdAt),
        startedAt: context.startedAt,
        settled: result !== undefined && !interrupted,
        interrupted,
        turnCloses: interrupted || context.turnCloses,
        text,
        files: interrupted
          ? []
          : ((delivered.length > 0
              ? delivered
              : fileEntries(readArray(args, "files"))) as never),
        uploads: result === undefined ? uploadFiles(args, text) : [],
        placing: result === undefined ? placingFiles(args, text) : [],
        placed:
          interrupted || toolName !== "message_user"
            ? []
            : readArray(data, "placed"),
        sources: interrupted ? undefined : (data.sources as never),
        references: interrupted ? undefined : (data.references as never),
        modelId: context.modelId,
        reasoningMode: context.reasoningMode,
        mode: context.mode,
      },
    ];
  }
  return [
    {
      ...base,
      type: "activity",
      kind: "tool",
      id: toolCallId,
      toolName,
      args,
      phase: toolPhase(result),
      result,
      waitResolvedAt: isWaitTool(toolName, result?.data)
        ? context.waitResolutions.get(toolCallId)
        : undefined,
      completions:
        toolName === "execute"
          ? executeCompletions(toolCallId, result, context.settlements)
          : undefined,
    },
  ];
};

const modeOf = (
  model: EventOf<"assistant">["payload"]["model"],
): "fast" | "pro" | undefined =>
  model.ultrafast === true ? ("ultrafast" as never) : model.mode;

/**
 * The per-event pass: every stored event to its rows, tool results settling
 * their tool lines, and the open turn located. Port of Capy's transcript row
 * builder (`transcript-rows` chunk).
 */
export const eventPass = (
  events: ReadonlyArray<Event>,
  truncatedHistory = false,
  deliveryTool: DeliveryTool = "message_user",
  turnClosedByRows = false,
): EventPass => {
  const ordered = orderEvents(events);
  const setupNotifications = new Map(
    ordered.flatMap((event) =>
      event.kind === "notification" &&
      event.payload.key === "mcp_setup_updated" &&
      event.payload.mcpSetup !== undefined
        ? [[event.payload.mcpSetup.toolCallId as string, event.id] as const]
        : [],
    ),
  );
  const environmentUpdates: EnvironmentUpdate[] = ordered.flatMap(
    (event, position) => {
      if (
        event.kind !== "notification" ||
        event.payload.key !== "environment_variables_updated"
      )
        return [];
      const update = event.payload.environmentVariablesUpdated;
      const variables: ReadonlySet<string> =
        update?.action === "configured" ? new Set(update.names) : new Set();
      const requestToolCallId =
        event.payload.ref?.kind === "environment_request"
          ? event.payload.ref.id
          : undefined;
      return requestToolCallId === undefined && variables.size === 0
        ? []
        : [{ position, requestToolCallId, variables }];
    },
  );
  const requestCalls = ordered.flatMap((event, position) =>
    event.kind === "assistant"
      ? event.payload.blocks.flatMap((block) =>
          block.type === "tool_use" &&
          (block.toolName === ENV_REQUEST_TOOL ||
            block.toolName === DESKTOP_REQUEST_TOOL ||
            block.toolName === TERMINAL_REQUEST_TOOL)
            ? [
                {
                  position,
                  toolName: block.toolName,
                  toolCallId: block.toolCallId as string,
                  variables: readArray(block.args, "variables").filter(
                    (name): name is string => typeof name === "string",
                  ),
                },
              ]
            : [],
        )
      : [],
  );
  const consumedRequests = new Set<string>();
  const toolCallIds = new Set(
    ordered.flatMap((event) =>
      event.kind === "assistant"
        ? event.payload.blocks.flatMap((block) =>
            block.type === "tool_use" ? [block.toolCallId as string] : [],
          )
        : [],
    ),
  );
  const settlements = new Map<string, Settlement>();
  const bashInputs = new Map<string, unknown>();
  const waitCalls = new Set<string>();
  const subscribeCalls = new Set<string>();
  const waitResolutions = new Map<string, Date>();
  const machineCalls = new Set<string>();

  const rows: Row[] = [];
  let park: { index: number; code: string } | undefined;
  let creditsIndex: number | undefined;

  const settleCredits = (
    standing: "open" | "waiting" | "settled",
    decision: string,
    untilMs?: number,
    switchedTo?: string,
  ) => {
    if (creditsIndex === undefined) return;
    const row = rows[creditsIndex];
    if (row?.type === "error")
      rows[creditsIndex] = {
        ...row,
        credits: standing,
        creditsUntilMs: standing === "waiting" ? untilMs : undefined,
        creditsOutcome:
          standing === "settled"
            ? switchedTo === undefined
              ? creditsOutcome(row.credits === "waiting", decision)
              : "switched"
            : undefined,
        creditsSwitchedTo: standing === "settled" ? switchedTo : undefined,
      };
    if (standing === "settled") creditsIndex = undefined;
  };

  interface Episode {
    index: number;
    sinceMs: number | undefined;
    cause: "start" | "reach" | "wedged";
    capacity: boolean;
  }
  const episodes = new Map<string, Episode>();
  const episodeRows = new Map<string, number>();
  const recovered = new Set<string>();
  const setupFailures = new Map<string, string[]>();

  const machineWarning = (
    machineId: string,
    event: Notification,
    code: string,
    message: string,
    episode: Record<string, unknown>,
  ) => {
    const machineEpisode = { ...episode, machineId };
    const open = episodes.get(machineId);
    const existing = open === undefined ? undefined : rows[open.index];
    if (open !== undefined && existing?.type === "error") {
      rows[open.index] = { ...existing, code, message, machineEpisode };
      return open.index;
    }
    rows.push({
      type: "error",
      severity: "warning",
      id: event.id,
      eventId: event.id,
      createdAt: event.createdAt,
      code,
      message,
      retryable: false,
      machineEpisode,
    });
    return rows.length - 1;
  };
  const markReconnected = (
    index: number,
    sinceMs: number | undefined,
    at: Date,
  ) => {
    const row = rows[index];
    if (
      row?.type !== "error" ||
      asRecord(row.machineEpisode).state === "settled"
    )
      return;
    rows[index] = {
      type: "marker",
      kind: "machine",
      id: `marker:${row.eventId}`,
      eventId: row.eventId,
      createdAt: row.createdAt,
      label:
        sinceMs === undefined
          ? "Machine reconnected"
          : `Machine reconnected after ${formatDuration(at.getTime() - sinceMs)}`,
    };
  };
  const removeRow = (index: number) => {
    rows.splice(index, 1);
    for (const [key, episode] of episodes)
      if (episode.index > index)
        episodes.set(key, { ...episode, index: episode.index - 1 });
    for (const [key, at] of episodeRows)
      if (at > index) episodeRows.set(key, at - 1);
  };
  const settleEpisodes = (at: Date) => {
    for (const episode of episodes.values())
      markReconnected(episode.index, episode.sinceMs, at);
    episodes.clear();
  };
  const settleSetup = (machineId: string, kind: string, at: Date) => {
    for (const id of setupFailures.get(machineId) ?? []) {
      const index = rows.findIndex((row) => row.id === id);
      const row = rows[index];
      if (row?.type === "error" && row.setup !== undefined)
        rows[index] = {
          ...row,
          setup: { ...asRecord(row.setup), outcome: { kind, at } },
        };
    }
    setupFailures.delete(machineId);
  };

  // Locate the open turn: the newest assistant event that neither delivered
  // nor stopped, with the continuation heuristics Capy applies per provider.
  let open: { id: EventId; blocks: ReadonlyArray<Block> } | undefined;
  let codexQuiet = 0;
  let anthropicQuiet = 0;
  let grokQuiet = 0;
  let codexArmed = !truncatedHistory;
  let anthropicArmed = !truncatedHistory;
  let grokArmed = !truncatedHistory;
  let reminders = 0;
  let agentCalls: Array<Extract<Block, { type: "tool_use" }>> | undefined;
  let crewParent: string | undefined;
  let userCalls: Array<Extract<Block, { type: "tool_use" }>> | undefined;
  const closesTurn = (
    block: Extract<Block, { type: "tool_use" }>,
    tool: DeliveryTool,
    settlement: Settlement | undefined,
  ) => {
    if (settlement?.isError === true) return false;
    if (block.toolName === "end_turn") return true;
    if (block.toolName === tool && isDeliveryTool(block.toolName, block.args))
      return deliveryState(block.args) !== undefined;
    if (tool !== "message_user") return false;
    if (isFinalSlackReact(block.toolName, block.args)) return true;
    if (settlement === undefined) return false;
    const call = unwrapToolCall(block.toolName, block.args);
    return MCP_TOOLS.has(call.toolName) &&
      mcpProposal(call.toolName, settlement.data) !== undefined
      ? true
      : CARD_TOOLS.has(block.toolName) ||
          block.toolName === DESKTOP_REQUEST_TOOL ||
          block.toolName === TERMINAL_REQUEST_TOOL;
  };
  const undelivered = () =>
    (agentCalls !== undefined &&
      !agentCalls.some((block) =>
        closesTurn(block, "message_agent", settlements.get(block.toolCallId)),
      )) ||
    (userCalls !== undefined &&
      !userCalls.some((block) =>
        closesTurn(block, "message_user", settlements.get(block.toolCallId)),
      ));
  const blockCloses = (block: Block) => {
    if (block.type !== "tool_use") return false;
    const settlement = settlements.get(block.toolCallId);
    const delivery = isDeliveryTool(block.toolName, block.args);
    const slack = isFinalSlackReact(block.toolName, block.args);
    if (
      delivery || slack
        ? settlement?.isError === true
        : settlement === undefined || settlement.isError
    )
      return false;
    if (
      !delivery &&
      (isWaitTool(block.toolName, settlement?.data) ||
        block.toolName === "submit_review" ||
        block.toolName === "end_turn")
    )
      return true;
    const call = unwrapToolCall(block.toolName, block.args);
    return (
      (MCP_TOOLS.has(call.toolName)
        ? mcpProposal(call.toolName, settlement?.data) !== undefined
        : delivery
          ? deliveryState(block.args) !== undefined
          : slack ||
            CARD_TOOLS.has(block.toolName) ||
            block.toolName === DESKTOP_REQUEST_TOOL ||
            block.toolName === TERMINAL_REQUEST_TOOL) && !undelivered()
    );
  };
  const closed = new Set<string>();
  const closeOpen = () => {
    if (
      open !== undefined &&
      !closed.has(open.id) &&
      open.blocks.some(blockCloses)
    )
      closed.add(open.id);
  };

  for (const event of ordered) {
    if (
      event.state === "abandoned" ||
      event.state === "discarded" ||
      event.state === "superseded"
    )
      throw new TypeError(
        `Event state excluded from display reads reached the chat: ${event.state}: ${event.id}`,
      );
    if (event.kind === "tool_result" || event.kind === "operation_completion") {
      const previous = settlements.get(event.payload.toolCallId);
      settlements.set(event.payload.toolCallId, {
        blocks: event.payload.blocks,
        data:
          event.kind === "tool_result" ? event.payload.data : previous?.data,
        isError: event.payload.isError,
        settledAt: previous?.settledAt ?? event.createdAt,
        eventId: event.id,
      });
      if (event.kind === "operation_completion")
        waitResolutions.set(event.payload.toolCallId, event.createdAt);
      if (event.kind === "tool_result") {
        if (isWaitTool("execute", event.payload.data))
          waitCalls.add(event.payload.toolCallId);
        for (const [index, call] of (
          executeData(event.payload.data)?.calls ?? []
        ).entries())
          if (call.tool === "bash")
            bashInputs.set(
              `${event.payload.toolCallId}:${index + 1}`,
              call.input,
            );
      }
    }
    if (event.kind === "assistant")
      for (const block of event.payload.blocks) {
        if (block.type === "tool_search_result")
          settlements.set(block.toolCallId, {
            blocks: [],
            data: { tools: block.tools },
            isError: block.error !== undefined,
            settledAt: event.createdAt,
            eventId: event.id,
          });
        if (block.type !== "tool_use") continue;
        if (block.toolName === "bash")
          bashInputs.set(block.toolCallId, block.args);
        if (block.toolName === "wait") waitCalls.add(block.toolCallId);
        if (MACHINE_TOOLS.has(block.toolName))
          machineCalls.add(block.toolCallId);
        if (block.toolName === "subscribe")
          subscribeCalls.add(block.toolCallId);
        agentCalls?.push(block);
        userCalls?.push(block);
      }
    if (event.kind === "notification") {
      if (event.payload.key === REASONING_CONTINUATION) {
        codexQuiet += 1;
        anthropicQuiet += 1;
        grokQuiet += 1;
      }
      if (event.payload.key === DELIVERY_REMINDER) reminders += 1;
      if (
        (event.payload.key === "crew.left" ||
          event.payload.key === "crew.joined") &&
        agentCalls !== undefined &&
        (event.payload.key === "crew.left") ===
          (event.payload.ref?.id === crewParent)
      )
        agentCalls = undefined;
    }
    if (event.kind === "assistant") {
      closeOpen();
      const payload = event.payload;
      if (payload.usage.outputTokens > 0) {
        codexQuiet = 0;
        codexArmed = true;
      }
      if (payload.blocks.some(hasProgress)) {
        anthropicQuiet = 0;
        anthropicArmed = true;
        grokQuiet = 0;
        grokArmed = true;
      }
      const codex =
        payload.route.providerId === "codex" &&
        payload.usage.outputTokens === 0 &&
        codexArmed &&
        codexQuiet < CODEX_CONTINUATIONS;
      const anthropic =
        payload.model.modelId.startsWith("anthropic/") &&
        !payload.blocks.some(hasProgress) &&
        anthropicArmed &&
        anthropicQuiet < ANTHROPIC_CONTINUATIONS;
      const grok =
        isGrok(payload.model.modelId) &&
        !payload.blocks.some(hasProgress) &&
        grokArmed &&
        grokQuiet < GROK_CONTINUATIONS;
      const reminded = reminders < DELIVERY_REMINDERS && undelivered();
      const continues =
        payload.stopReason === "end_turn" &&
        (codex || anthropic || grok || reminded);
      open =
        payload.stopReason === "tool_use"
          ? { id: event.id, blocks: payload.blocks }
          : continues
            ? open !== undefined && !closed.has(open.id)
              ? open
              : { id: event.id, blocks: payload.blocks }
            : undefined;
    }
    if (event.kind === "error") {
      closeOpen();
      open = undefined;
    }
    if (event.kind === "message") {
      closeOpen();
      if (event.payload.delivery === "interrupt") open = undefined;
      anthropicQuiet = 0;
      anthropicArmed = true;
      grokQuiet = 0;
      grokArmed = true;
      const origin = event.payload.origin;
      const peer =
        origin.type === "agent" &&
        origin.relation.type === "peer" &&
        origin.relation.captain !== true;
      if (event.state !== "pending" && !peer) {
        reminders = 0;
        if (deliveryTool === "message_agent" || origin.type === "agent") {
          agentCalls = [];
          crewParent =
            event.payload.actor.type === "agent"
              ? event.payload.actor.jamId
              : undefined;
        } else {
          userCalls = [];
          agentCalls = undefined;
        }
      }
    }
    if (
      event.kind === "control" &&
      asRecord(event.payload.command).type === "stop"
    ) {
      closeOpen();
      open = undefined;
    }
  }
  closeOpen();
  const openTurnId =
    !turnClosedByRows && open !== undefined && !closed.has(open.id)
      ? open.id
      : undefined;

  const cancelledInputs = new Set<string>();
  const versionRoots = new Set<string>();
  for (const event of ordered) {
    const command =
      event.kind === "control" ? asRecord(event.payload.command) : {};
    if (
      command.type === "cancel_input" &&
      typeof command.targetEventId === "string"
    )
      cancelledInputs.add(command.targetEventId);
    if (event.kind === "context") {
      const root = asRecord(event.payload.context).root;
      if (typeof root === "string") versionRoots.add(root);
    }
  }
  const desktopRequests = new Map<string, "done" | "expired">();
  for (const event of ordered) {
    if (
      event.kind !== "notification" ||
      event.payload.ref?.kind !== "desktop_request"
    )
      continue;
    const id = event.payload.ref.id;
    if (event.payload.key === "desktop_request_done")
      desktopRequests.set(id, "done");
    if (
      event.payload.key === "desktop_request_expired" &&
      desktopRequests.get(id) !== "done"
    )
      desktopRequests.set(id, "expired");
  }
  const lastConnectionChange = ordered.findLast(
    (event) =>
      event.kind === "notification" &&
      event.payload.key === "connection_changed",
  )?.id;
  const supersededCredits = new Set<string>();
  let pendingCredits: string | undefined;
  for (const event of ordered) {
    if (
      event.kind === "assistant" ||
      (event.kind === "notification" &&
        (event.payload.key === "credits_waiting" ||
          event.payload.key === "credits_answered"))
    )
      pendingCredits = undefined;
    if (
      event.kind === "error" &&
      event.payload.code === "credits_consent_required" &&
      !failedOver(event.payload.data)
    ) {
      if (pendingCredits !== undefined) supersededCredits.add(pendingCredits);
      pendingCredits = event.id;
    }
  }
  const replyIds = ordered
    .flatMap((event) =>
      event.kind === "message" &&
      event.payload.actor.type !== "agent" &&
      (event.state !== "pending" ||
        (event.payload.delivery !== "queue" &&
          event.payload.delivery !== "steer")) &&
      !(event.state === "cancelled" && cancelledInputs.has(event.id))
        ? [event.id]
        : [],
    )
    .sort();
  const terminalRequests = collectTerminalRequests(ordered);
  const feedbackRequests = new Map(
    ordered.flatMap((event) =>
      event.kind === "notification" &&
      event.payload.feedbackRequest !== undefined
        ? [
            [
              event.payload.feedbackRequest.toolCallId as string,
              event.payload.feedbackRequest.outcome,
            ] as const,
          ]
        : [],
    ),
  );
  const subagentCredits = ordered.flatMap((event) =>
    event.kind === "notification" && event.payload.subagentCredits !== undefined
      ? [
          {
            ...event.payload.subagentCredits,
            at: event.createdAt.getTime(),
            resetsAtMs: event.payload.resetsAtMs,
          },
        ]
      : [],
  );
  const subagentStanding = (
    childJamId: string,
    at: number,
    standing: "open" | "waiting" | "settled",
    modelId: string | undefined,
  ) => {
    const later = subagentCredits
      .filter((entry) => entry.childJamId === childJamId && entry.at > at)
      .sort((a, b) => a.at - b.at);
    const reopened = later.findIndex(
      (entry) =>
        entry.standing === "open" ||
        (entry.standing === "waiting" && entry.data !== undefined),
    );
    const last = reopened === -1 ? later.at(-1) : undefined;
    const current = reopened === -1 ? (last?.standing ?? standing) : "settled";
    const continued =
      last?.standing === "settled" && last.decision === undefined
        ? continuingOn.exec(last.message ?? "")?.[1]
        : undefined;
    const switchedTo =
      continued === undefined ||
      (modelId !== undefined && modelName(modelId) === continued)
        ? undefined
        : continued;
    const waited =
      standing === "waiting" ||
      later
        .slice(0, reopened === -1 ? -1 : reopened)
        .some((entry) => entry.standing === "waiting");
    return {
      standing: current,
      untilMs: current === "waiting" ? last?.resetsAtMs : undefined,
      outcome:
        current === "settled"
          ? switchedTo === undefined
            ? creditsOutcome(
                waited,
                last === undefined || continued !== undefined
                  ? "resumed"
                  : (last.decision ?? "answered"),
              )
            : "switched"
          : undefined,
      switchedTo,
    };
  };

  const clientKeys = new Set<string>();
  let previousOrigin: Origin | undefined;

  for (const [position, event] of ordered.entries()) {
    const base = { eventId: event.id, createdAt: event.createdAt };
    const marker = markerFor(event);
    switch (event.kind) {
      case "rule":
      case "legacy":
        break;
      case "review_request":
        rows.push(
          marker(
            "review",
            `${event.payload.trigger === "automatic" ? "Reviewing push" : event.payload.trigger === "force_refresh" ? "Re-review requested at" : "Review requested at"} ${event.payload.headSha.slice(0, 7)}`,
          ),
        );
        break;
      case "handoff": {
        const payload = event.payload;
        if (payload.result.kind === "failed") {
          if (park?.code === "handoff_in_progress") {
            removeRow(park.index);
            park = undefined;
          }
          rows.push({
            type: "error",
            severity: "warning",
            id: event.id,
            ...base,
            code: "handoff",
            message: handoffFailureLabel(payload as never),
            retryable: false,
          });
          break;
        }
        const toDevice = payload.direction === "cloud_to_device";
        rows.push(
          marker(
            toDevice ? "return" : "handoff",
            toDevice
              ? payload.source?.deviceName === undefined
                ? `Returned to ${payload.destination?.deviceName ?? "device"}`
                : `Moved to ${payload.destination?.deviceName ?? "device"}`
              : payload.movedByAgent === true
                ? "Capy moved the workspace to cloud"
                : park?.code === "device_offline"
                  ? "Device offline, handed off to cloud"
                  : "Handed off to cloud",
          ),
        );
        if (park !== undefined) removeRow(park.index);
        park = undefined;
        const failures = payload.result.setupFailures ?? [];
        if (failures.length > 0)
          rows.push({
            type: "error",
            severity: "warning",
            id: `setup:${event.id}`,
            ...base,
            code: "handoff",
            message: `Setup did not complete on the cloud machine: ${failures.map((failure) => `${failure.phase} failed for ${failure.repo}: ${failure.detail}`).join("; ")}`,
            retryable: false,
          });
        break;
      }
      case "mobile_session":
        rows.push({
          type: "mobile-session",
          id: event.id,
          ...base,
          sessionId: event.payload.sessionId,
          platform: event.payload.platform,
          appName: event.payload.appName,
          deviceModel: event.payload.deviceModel,
          status: event.payload.status,
        });
        break;
      case "context": {
        const context = asRecord(event.payload.context);
        if ("change" in context) {
          const access = {
            change: String(context.change),
            byName: readString(context, "byName") ?? "A member",
            names: readArray(context, "names").filter(
              (name): name is string => typeof name === "string",
            ),
            container: readString(context, "container") ?? "thread",
          };
          rows.push(
            marker("access", accessLabel(access, "the organization"), {
              access,
            }),
          );
          break;
        }
        if ("idleDays" in context) {
          rows.push(
            marker("archive", `Archived after ${context.idleDays} days idle`),
          );
          break;
        }
        if ("takerUserId" in context) {
          rows.push(
            marker(
              "takeover",
              `${readString(context, "takerName") ?? "A member"} took over the thread from ${context.previousUserType === "service" ? "a service user" : (readString(context, "previousName") ?? "a former member")}`,
            ),
          );
          break;
        }
        if (
          "sourceJamId" in context &&
          (context.kind === "fork" || context.mode !== undefined)
        )
          rows.push(
            marker(
              "fork",
              context.kind === "fork"
                ? context.mode === "summary"
                  ? "Forked with a summary from"
                  : "Forked from"
                : "Side thread of",
              {
                reference: {
                  jamId: context.sourceJamId as JamId,
                  title: readString(context, "sourceTitle"),
                },
              },
            ),
          );
        break;
      }
      case "message": {
        const payload = event.payload;
        if (
          (payload.text.length === 0 && payload.files.length === 0) ||
          (payload.actor.type === "system" &&
            payload.actor.service === "system" &&
            payload.origin.type === "system") ||
          (event.state === "pending" &&
            (payload.delivery === "queue" || payload.delivery === "steer")) ||
          (event.state === "cancelled" && cancelledInputs.has(event.id))
        )
          break;
        if (payload.retryOf !== undefined) {
          const credits =
            creditsIndex === undefined ? undefined : rows[creditsIndex];
          const failedModel =
            credits?.type === "error"
              ? readString(credits.data, "modelId")
              : undefined;
          const switchedTo =
            credits?.type === "error" &&
            credits.eventId === payload.retryOf &&
            payload.model !== undefined &&
            payload.model.modelId !== failedModel
              ? modelName(payload.model.modelId)
              : undefined;
          if (switchedTo !== undefined)
            settleCredits("settled", "resumed", undefined, switchedTo);
          const author =
            "authorName" in payload.origin
              ? payload.origin.authorName
              : undefined;
          rows.push(
            marker(
              "retry",
              `${author ?? "Someone"} ${switchedTo === undefined ? "retried" : `switched to ${switchedTo}`}`,
            ),
          );
          break;
        }
        const clientKey =
          payload.clientKey === undefined || clientKeys.has(payload.clientKey)
            ? undefined
            : payload.clientKey;
        if (clientKey !== undefined) clientKeys.add(clientKey);
        rows.push({
          type: "user-message",
          id: event.id,
          ...base,
          text: payload.text,
          mentions: payload.mentions ?? [],
          files: payload.files,
          delivery: payload.delivery,
          actor: payload.actor,
          origin: payload.origin,
          showOrigin:
            previousOrigin === undefined ||
            !sameOrigin(previousOrigin, payload.origin),
          state: inputState(event.state, event.id),
          clientKey,
          editOf: payload.editOf,
          defaulted:
            payload.model === undefined || payload.modelDefault === undefined
              ? undefined
              : {
                  modelId: payload.model.modelId,
                  modelDefault: payload.modelDefault,
                },
          versionRoot: versionRoots.has(payload.editOf ?? event.id)
            ? (payload.editOf ?? event.id)
            : undefined,
        });
        previousOrigin = payload.origin;
        break;
      }
      case "control": {
        const command = asRecord(event.payload.command);
        if (command.type === "promote_captain")
          rows.push(
            marker("captain", `Promoted to Captain as ${command.name}`),
          );
        if (command.type === "demote_captain")
          rows.push(marker("captain", `${command.name} demoted to a thread`));
        if (command.type === "rename_captain")
          rows.push(
            marker("captain", `${command.from} renamed to ${command.name}`),
          );
        if (
          command.type === "compact" &&
          (event.state === "pending" || event.state === "promoted")
        )
          rows.push(
            marker("compaction", "Compacting the conversation", { live: true }),
          );
        break;
      }
      case "notification":
        notificationRows(event, position);
        break;
      case "task_completion":
        rows.push({
          type: "update",
          kind: "task",
          id: event.id,
          ...base,
          childJamId: event.payload.childJamId,
          reference: { kind: "task", localIndex: event.payload.localIndex },
          outcome: event.payload.outcome,
          deliveryState: event.payload.deliveryState,
          ask: event.payload.ask,
          summary: event.payload.summary,
          attachments: event.payload.attachments ?? [],
          sources: event.payload.sources,
          references: event.payload.references,
        } as Row);
        break;
      case "thread_completion":
        if (event.payload.quiet === true) break;
        rows.push({
          type: "update",
          kind: "task",
          id: event.id,
          ...base,
          childJamId: event.payload.childJamId,
          reference: {
            kind: "thread",
            code: event.payload.threadCode,
            title: event.payload.title,
            pullRequests: event.payload.pullRequests,
          },
          outcome: event.payload.outcome,
          deliveryState: event.payload.deliveryState,
          ask: event.payload.ask,
          needs: event.payload.needs,
          answered: event.payload.answered,
          summary: event.payload.summary,
          attachments: event.payload.attachments ?? [],
          sources: event.payload.sources,
          references: event.payload.references,
        } as Row);
        break;
      case "operation_completion": {
        const payload = event.payload;
        if (
          waitCalls.has(payload.toolCallId) ||
          rows.some(
            (row) =>
              (row.type === "terminal-request" &&
                row.toolCallId === payload.toolCallId) ||
              (isTool(row) &&
                row.toolName === TERMINAL_REQUEST_TOOL &&
                row.id === payload.toolCallId),
          )
        )
          break;
        if (isParkCall(payload.toolCallId)) {
          const parked = park === undefined ? undefined : rows[park.index];
          if (park !== undefined && parked?.type === "marker")
            rows[park.index] = {
              ...parked,
              label:
                park.code !== "device_offline" ||
                !payload.toolCallId.startsWith("devpark_")
                  ? parked.label
                  : payload.isError
                    ? "Device offline, stopped waiting"
                    : "Device reconnected",
              live: undefined,
            };
          park = undefined;
          break;
        }
        const watch =
          subscribeCalls.has(payload.toolCallId) ||
          watchPrefixes.some((prefix) => payload.toolCallId.startsWith(prefix));
        const watchEnded = asRecord(payload).watchEnded;
        if (asRecord(watchEnded).reason === "superseded") break;
        rows.push({
          type: "update",
          kind: "operation",
          id: event.id,
          ...base,
          operationId: payload.operationId,
          toolCallId: payload.toolCallId,
          blocks: payload.blocks,
          isError: payload.isError,
          commandLabel: readString(
            bashInputs.get(payload.toolCallId),
            "command",
          ),
          watch,
          watchEnded,
        });
        break;
      }
      case "tool_result":
        if (
          machineCalls.has(event.payload.toolCallId) &&
          !event.payload.isError
        )
          settleEpisodes(event.createdAt);
        break;
      case "error": {
        const payload = event.payload;
        if (failedOver(payload.data) || supersededCredits.has(event.id)) break;
        if (parkCodes.has(payload.code)) {
          park = { index: rows.length, code: payload.code };
          const handoff =
            payload.code === "handoff_in_progress"
              ? asRecord(payload.data)
              : undefined;
          const deviceName = readString(handoff, "deviceName") ?? "device";
          rows.push(
            marker(
              handoff?.direction === "cloud_to_device" ? "return" : "offline",
              payload.code === "device_offline"
                ? payload.message
                : handoff === undefined ||
                    handoff.direction === "device_to_cloud"
                  ? "Moving to cloud"
                  : handoff.sourceSettingUp === true
                    ? `Moving to ${deviceName} once the cloud machine is set up`
                    : `Moving to ${deviceName}`,
              { live: true },
            ),
          );
          break;
        }
        if (payload.code === "credits_consent_required") {
          settleCredits("settled", "resumed");
          creditsIndex = rows.length;
        }
        rows.push({
          type: "error",
          credits:
            payload.code === "credits_consent_required" ? "open" : undefined,
          severity: payload.retryable ? "warning" : "error",
          id: event.id,
          ...base,
          code: payload.code,
          message: payload.message,
          retryable: payload.retryable,
          data: payload.data,
        });
        break;
      }
      case "compact":
        rows.push(
          marker(
            "compaction",
            event.payload.tokensBefore === undefined
              ? "Compacted the conversation"
              : `Compacted from ${formatCompact(event.payload.tokensBefore)} tokens`,
          ),
        );
        break;
      case "assistant": {
        settleCredits("settled", "resumed");
        const payload = event.payload;
        if (payload.wireDropped !== undefined)
          rows.push({
            type: "activity",
            kind: "wire",
            id: `${event.id}:wire`,
            ...base,
            startedAt: payload.startedAt,
            turnOpen: false,
            turnCloses: false,
            text: wireDroppedLabel(payload.wireDropped),
          });
        const first = rows.length;
        for (const block of payload.blocks)
          rows.push(
            ...blockRows(block, {
              ...base,
              startedAt: payload.startedAt,
              modelId: payload.model.servedModelId ?? payload.model.modelId,
              reasoningMode: payload.model.reasoningMode,
              mode: modeOf(payload.model),
              exchangeEventId: payload.interruption?.exchangeEventId,
              turnOpen: event.id === openTurnId,
              turnCloses: closed.has(event.id),
              settlements,
              waitResolutions,
              setupNotificationEventId:
                block.type === "tool_use"
                  ? setupNotifications.get(block.toolCallId)
                  : undefined,
              eventPosition: position,
              environmentUpdates,
              desktopRequests,
              replyIds,
              terminalRequests,
              feedbackRequests,
            }),
          );
        if (
          payload.stopReason === "refusal" &&
          !payload.blocks.some(
            (block) => block.type === "text" && block.text.trim().length > 0,
          )
        )
          rows.push({
            type: "error",
            severity: "warning",
            id: `${event.id}:refusal`,
            ...base,
            code: "model_refusal",
            message: "The model declined to respond",
            retryable: false,
            data: {
              modelId: payload.model.servedModelId ?? payload.model.modelId,
            },
          });
        const produced = rows.slice(first);
        const lastMessage = produced
          .map((row) => row.type === "agent-message")
          .lastIndexOf(true);
        const messageAt = produced[lastMessage]?.createdAt;
        const worksAfter = produced
          .slice(lastMessage + 1)
          .some(
            (row) =>
              row.type === "activity" ||
              row.type === "clarify" ||
              row.type === "environment-request" ||
              row.type === "desktop-request" ||
              row.type === "terminal-request",
          );
        if (event.id === openTurnId && !worksAfter)
          rows.push(
            hiddenReasoning(
              event.id,
              messageAt ?? event.createdAt,
              messageAt ?? payload.startedAt,
            ),
          );
        break;
      }
      case "unsupported":
        rows.push(marker("unsupported", UNSUPPORTED_LABEL));
        break;
    }
  }

  function notificationRows(event: Notification, position: number) {
    const payload = event.payload;
    const key = payload.key;
    const base = { eventId: event.id, createdAt: event.createdAt };
    const marker = markerFor(event);
    if (key === "connection_changed") {
      if (event.id !== lastConnectionChange) return;
      const change = payload.connectionChange;
      const label =
        change === undefined
          ? { label: payload.summary, title: payload.summary }
          : connectionLabel(
              change,
              payload.ref === undefined
                ? /\bkey$/i.test(change.from)
                : payload.ref.kind !== "member_seat",
            );
      rows.push(
        marker(
          change?.to === "Capy credits" ? "credits" : "switch",
          label.label,
          {
            title: label.title,
          },
        ),
      );
      return;
    }
    if (key === "startup_settled") settleEpisodes(event.createdAt);
    if (machineKeys.has(key)) {
      const episode = payload.machineEpisode;
      const machineId =
        episode?.machineId ??
        /^Machine (\S+?)(?:'s)?\s/.exec(payload.summary)?.[1] ??
        "";
      const current = episodes.get(machineId);
      const same =
        current !== undefined && current.sinceMs === episode?.sinceMs;
      const episodeKey =
        episode?.sinceMs === undefined
          ? undefined
          : `${machineId} ${episode.sinceMs}`;
      if (
        episodeKey !== undefined &&
        recovered.has(episodeKey) &&
        (key === "machine_trouble" || key === "machine_unavailable")
      )
        return;
      if (key === "machine_recovered") {
        if (episodeKey === undefined) return;
        recovered.add(episodeKey);
        const index = episodeRows.get(episodeKey);
        if (index !== undefined)
          markReconnected(index, episode?.sinceMs, event.createdAt);
        if (same) episodes.delete(machineId);
      } else if (key === "machine_trouble") {
        const cause = episode?.cause ?? "reach";
        const capacity = episode?.capacity === true;
        const trouble = capacity ? capacityTrouble : machineTrouble[cause];
        if (!same) episodes.delete(machineId);
        const index = machineWarning(
          machineId,
          event,
          trouble.code,
          trouble.message,
          {
            state: "trying",
            cause,
            capacity,
            sinceMs: episode?.sinceMs,
          },
        );
        episodes.set(machineId, {
          index,
          sinceMs: episode?.sinceMs,
          cause,
          capacity,
        });
        if (episodeKey !== undefined) episodeRows.set(episodeKey, index);
      } else if (key === "machine_unavailable") {
        const sinceMs = episode?.sinceMs;
        const cause = same ? current.cause : "reach";
        const capacity =
          episode?.capacity === true || (same && current.capacity);
        if (!same) episodes.delete(machineId);
        const span =
          sinceMs === undefined
            ? ""
            : ` for ${formatSpan(event.createdAt.getTime() - sinceMs)}`;
        const index = machineWarning(
          machineId,
          event,
          "machine_unavailable",
          capacity
            ? `The sandbox fleet had no room for your machine${span}, send a message to try again`
            : `Capy could not reach your machine${span}, send a message to try again`,
          { state: "gave-up", cause, capacity, sinceMs },
        );
        episodes.set(machineId, { index, sinceMs, cause, capacity });
        if (episodeKey !== undefined) episodeRows.set(episodeKey, index);
      } else if (
        key === "workspace_replaced" &&
        episode?.idleDays !== undefined
      ) {
        const existing =
          current === undefined ? undefined : rows[current.index];
        const warning = existing?.type === "error" ? existing : undefined;
        const row: Row = {
          type: "marker",
          kind: "machine",
          id: `marker:${warning?.eventId ?? event.id}`,
          eventId: warning?.eventId ?? event.id,
          createdAt: warning?.createdAt ?? event.createdAt,
          label: `Idle workspace cleared after ${episode.idleDays === 1 ? "1 day" : `${episode.idleDays} days`}, the next run starts fresh from Setup`,
        };
        if (current !== undefined && warning !== undefined)
          rows[current.index] = row;
        else rows.push(row);
        episodes.delete(machineId);
      } else {
        const restored = key === "workspace_restored";
        machineWarning(
          machineId,
          event,
          restored ? "workspace_restored" : "workspace_rebuilt",
          restored
            ? "Your machine came back from an earlier save, changes made after that are gone"
            : "Your old machine could not be recovered, so Capy rebuilt it from setup and files not pushed to git are gone",
          {
            state: "settled",
            cause: current?.cause ?? "reach",
            sinceMs: current?.sinceMs,
          },
        );
        episodes.delete(machineId);
      }
      return;
    }
    if (
      driveKeys.has(key) &&
      payload.driveNotice === undefined &&
      payload.driveFull === undefined
    )
      return;
    const category = categoryOf(key);
    if (category === "internal") return;
    if (category === "permission" && payload.permissionDecided !== undefined) {
      const decided = payload.permissionDecided;
      if (
        decided.capability !== "device_message" &&
        decided.toolCallId !== undefined &&
        toolCallIds.has(decided.toolCallId)
      )
        return;
      rows.push(
        marker(
          "permission",
          decided.capability === "slack_user_read"
            ? decided.decision === "granted"
              ? `${decided.standing ? "Always allowed" : "Allowed"} reading Slack as ${decided.subject}`
              : decided.decision === "denied"
                ? `Denied reading Slack as ${decided.subject}`
                : `Reading Slack as ${decided.subject} revoked`
            : decided.decision === "granted"
              ? `${decided.standing ? "Always allowed" : "Allowed"} on ${decided.subject}`
              : decided.decision === "denied"
                ? `Denied on ${decided.subject}`
                : `Access to ${decided.subject} revoked`,
        ),
      );
      return;
    }
    const crew = crewMarkers[key];
    if (category === "crew" && crew !== undefined) {
      const reference =
        payload.ref?.kind === "jam"
          ? { jamId: payload.ref.id as JamId, title: undefined }
          : undefined;
      const previous = rows.at(-1);
      const joinable =
        previous?.type === "marker" &&
        previous.kind === "crew" &&
        previous.referenceLeads === true &&
        previous.label === crew.label
          ? previous
          : undefined;
      const members =
        joinable?.members ??
        (joinable?.reference === undefined ? undefined : [joinable.reference]);
      if (
        crew.leads &&
        reference !== undefined &&
        joinable !== undefined &&
        members !== undefined
      )
        rows[rows.length - 1] = {
          ...joinable,
          reference: undefined,
          members: [...members, reference],
        };
      else
        rows.push(
          marker("crew", crew.label, { referenceLeads: crew.leads, reference }),
        );
      return;
    }
    if (category === "environment") {
      const update = payload.environmentVariablesUpdated;
      if (update === undefined || update.names.length === 0) return;
      const requestId =
        payload.ref?.kind === "environment_request"
          ? payload.ref.id
          : undefined;
      const request = requestCalls.find(
        (call) =>
          call.position < position &&
          call.toolName === ENV_REQUEST_TOOL &&
          !consumedRequests.has(call.toolCallId) &&
          (call.toolCallId === requestId ||
            (update.action === "configured" &&
              call.variables.length === update.names.length &&
              call.variables.every((name) => update.names.includes(name)))),
      );
      if (request !== undefined) {
        consumedRequests.add(request.toolCallId);
        return;
      }
      rows.push(marker("environment", environmentLabel(update)));
      return;
    }
    if (category === "issues") {
      const enabled =
        payload.issuesSwitched?.enabled ??
        !payload.summary.startsWith("Issues are now off");
      rows.push(
        marker("issues", enabled ? "Enabled issues" : "Disabled issues"),
      );
      return;
    }
    if (category === "setup") {
      if (key === "setup_recovered") {
        const machineId = payload.setupRecovered?.machineId;
        if (machineId !== undefined)
          settleSetup(machineId, "recovered", event.createdAt);
        return;
      }
      const failure = payload.setupFailure;
      if (failure !== undefined) {
        settleSetup(failure.machineId, "failed_again", event.createdAt);
        setupFailures.set(failure.machineId, [
          ...(setupFailures.get(failure.machineId) ?? []),
          event.id,
        ]);
        rows.push({
          type: "error",
          severity: "warning",
          id: event.id,
          ...base,
          code: key,
          message: failure.detail,
          retryable: false,
          setup: failure,
        });
        return;
      }
      const repo = payload.setupFailed?.repo;
      rows.push(
        marker(
          "setup",
          `Setup failed${repo === undefined ? "" : ` for ${repo.slice(repo.indexOf("/") + 1)}`}, run it again from the machine menu`,
        ),
      );
      return;
    }
    if (category === "crew_credits") {
      const credits = payload.crewCredits;
      if (credits === undefined) return;
      rows.push({
        type: "error",
        severity: "warning",
        id: event.id,
        ...base,
        code: "credits_consent_required",
        message: `${credits.threadCode} is held on a usage limit`,
        retryable: false,
        data: credits.data,
        credits: credits.standing === "open" ? "open" : "settled",
      });
      return;
    }
    if (category === "subagent_credits") {
      const credits = payload.subagentCredits;
      if (credits === undefined) return;
      if (
        credits.standing === "open" ||
        (credits.standing === "waiting" && credits.data !== undefined)
      ) {
        const standing = subagentStanding(
          credits.childJamId,
          event.createdAt.getTime(),
          credits.standing,
          readString(credits.data, "modelId"),
        );
        rows.push({
          type: "error",
          severity: "warning",
          id: event.id,
          ...base,
          code: "credits_consent_required",
          message: credits.message ?? payload.summary,
          retryable: false,
          data: credits.data,
          credits: standing.standing,
          creditsUntilMs: standing.untilMs,
          creditsOutcome: standing.outcome,
          creditsSwitchedTo: standing.switchedTo,
          subagent: { jamId: credits.childJamId, path: credits.path },
        });
        return;
      }
      rows.push(
        marker(
          "permission",
          `Subagent ${credits.path}: ${credits.message ?? payload.summary}`,
        ),
      );
      return;
    }
    if (category === "credits") {
      const holding = creditsIndex !== undefined;
      settleCredits(
        key === "credits_waiting" ? "waiting" : "settled",
        payload.creditsDecision ?? "answered",
        payload.resetsAtMs,
      );
      if (holding) return;
      rows.push(marker("permission", payload.summary));
      return;
    }
    if (category === "review") {
      rows.push({
        type: "update",
        kind: "review",
        id: event.id,
        ...base,
        prNumber: payload.reviewCompletion?.prNumber,
        issues: payload.reviewCompletion?.issues,
      });
      return;
    }
    if (category === "warning" || payload.severity === "warning") {
      const notice =
        payload.driveFull === undefined ? driveNotice(payload) : undefined;
      rows.push({
        type: "error",
        severity: "warning",
        id: event.id,
        ...base,
        code:
          key === "volume_quota"
            ? "drive_not_saved"
            : key === "drive_bulk_delete"
              ? "drive_deletes_held"
              : key,
        message: driveKeys.has(key)
          ? (payload.driveNotice ??
            "Drive is full, files from this turn were not saved")
          : notice === undefined
            ? payload.summary
            : notice.lines.join(", "),
        retryable: false,
        data: payload.driveFull,
        notice,
      });
      return;
    }
    if (key === "phone_attached" && payload.ref?.kind === "machine") {
      rows.push({
        type: "phone-card",
        id: event.id,
        ...base,
        machineId: payload.ref.id as never,
        summary: payload.summary,
      });
      return;
    }
    if (
      (key === "desktop_request_done" || key === "desktop_request_expired") &&
      requestCalls.some(
        (call) =>
          call.position < position &&
          call.toolName === DESKTOP_REQUEST_TOOL &&
          call.toolCallId ===
            (payload.desktopRequest?.toolCallId ??
              (payload.ref?.kind === "desktop_request"
                ? payload.ref.id
                : undefined)),
      )
    )
      return;
    if (
      key === "terminal_request_done" &&
      requestCalls.some(
        (call) =>
          call.position < position &&
          call.toolName === TERMINAL_REQUEST_TOOL &&
          payload.ref?.kind === "terminal_request" &&
          call.toolCallId === payload.ref.id,
      )
    )
      return;
    rows.push({
      type: "update",
      kind: "notice",
      id: event.id,
      ...base,
      notificationKey: key,
      prFeedback: key === "pr_feedback" ? payload.prFeedback : undefined,
      summary: payload.summary,
      fileSaved: payload.fileSaved,
      slackMessage:
        key === "slack_subscription_message" ? payload.slackMessage : undefined,
      ciResult: key === "ci_result" ? payload.ciResult : undefined,
      desktopRequest:
        key === "desktop_request_done" || key === "desktop_request_expired"
          ? payload.desktopRequest
          : undefined,
      filesCopied: key === "files_copied" ? payload.filesCopied : undefined,
      prTransition:
        key === "pr_merged" || key === "pr_closed"
          ? payload.prTransition
          : undefined,
      prConflict: key === "pr_conflict" ? payload.prConflict : undefined,
      reviewFailed: key === "review_failed" ? payload.reviewFailed : undefined,
      githubEvent:
        key === "github_subscription_event" ? payload.githubEvent : undefined,
      webhookRequest:
        key === "webhook_subscription_request"
          ? payload.webhookRequest
          : undefined,
      issueActivity:
        key === "issue_activity" ? payload.issueActivity : undefined,
      ciUnsettled:
        key === "ci_incomplete" || key === "ci_no_checks"
          ? payload.ciUnsettled
          : undefined,
    });
  }

  return {
    ordered,
    entries: rows,
    settledTimeline: mergeReasoning(rows),
    openTurnId,
    callIds: new Set(rows.flatMap((row) => (isCallRow(row) ? [row.id] : []))),
  };
};

type MarkerRow = Extract<Row, { type: "marker" }>;

const markerFor =
  (event: Event) =>
  (
    kind: MarkerRow["kind"],
    label: string,
    extra: Partial<MarkerRow> = {},
  ): Row => ({
    type: "marker",
    kind,
    id: `marker:${event.id}`,
    eventId: event.id,
    createdAt: event.createdAt,
    label,
    ...extra,
  });

const failedOver = (data: unknown) => asRecord(data).failedOver === true;

const inputState = (
  state: EventRow["state"],
  id: string,
): Extract<Row, { type: "user-message" }>["state"] => {
  if (
    state === "committed" ||
    state === "abandoned" ||
    state === "discarded" ||
    state === "superseded"
  )
    throw new TypeError(`Input row in an output state: ${state}: ${id}`);
  return state as Extract<Row, { type: "user-message" }>["state"];
};

const collectTerminalRequests = (
  events: ReadonlyArray<EventRow>,
): TerminalRequests => {
  const settled = new Map<string, boolean>();
  const completions = new Map<
    string,
    { isError: boolean; exitCode: number | undefined }
  >();
  const done = new Set<string>();
  const cancelled = new Set<string>();
  for (const event of events) {
    if (event.kind === "tool_result") {
      if (!settled.has(event.payload.toolCallId))
        settled.set(event.payload.toolCallId, event.payload.isError);
      for (const call of executeData(event.payload.data)?.calls ?? []) {
        const operationId =
          call.tool === "operation_cancel" && call.error === undefined
            ? readString(call.input, "operation_id")
            : undefined;
        if (
          operationId !== undefined &&
          readString(call.data, "state") === "cancelled"
        )
          cancelled.add(operationId);
      }
    }
    if (event.kind === "operation_completion")
      completions.set(event.payload.toolCallId, {
        isError: event.payload.isError,
        exitCode: readNumber(event.payload, "exitCode"),
      });
    if (
      event.kind === "notification" &&
      event.payload.key === "terminal_request_done" &&
      event.payload.ref?.kind === "terminal_request"
    )
      done.add(event.payload.ref.id);
  }
  return { settled, completions, done, cancelled };
};

/** Rows that stand for a model call (a message, a card, a tool line). */
export const isCallRow = (row: Row) =>
  row.type === "agent-message" ||
  row.type === "clarify" ||
  row.type === "environment-request" ||
  row.type === "mcp-setup" ||
  isTool(row);

/** The hidden "still working" line the open turn shows after its last settled line. */
export const hiddenReasoning = (
  eventId: EventId,
  createdAt: Date,
  startedAt: Date | undefined,
): ReasoningRow => ({
  type: "activity",
  kind: "reasoning",
  id: `${eventId}${HIDDEN_SUFFIX}`,
  eventId,
  createdAt,
  startedAt,
  turnOpen: true,
  turnCloses: false,
  text: "",
  presentation: "summary",
  elapsedMs: 0,
});
