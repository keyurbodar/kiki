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
  const sorted = [...events].sort((a, b) => (a.id < b.id ? -1 : +(a.id > b.id)));
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
const driveKeys = new Set(["volume_quota", "drive_unmounted", "drive_bulk_delete"]);
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
  const markReconnected = (index: number, sinceMs: number | undefined, at: Date) => {
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
    if (open !== undefined && !closed.has(open.id) && open.blocks.some(blockCloses))
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
        data: event.kind === "tool_result" ? event.payload.data : previous?.data,