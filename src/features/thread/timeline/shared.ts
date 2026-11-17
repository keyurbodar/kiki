import type {
  EventId,
  ExecuteCall,
  TimelineRow,
  ToolSettlement,
} from "@/data/events";
import { EventId as EventIdSchema } from "@/data/events";

/** Capy's stamp gap: a time stamp sits above a turn that starts an hour or more after the previous row. */
export const STAMP_GAP_MS = 3_600_000;

/** Sentinel event id every live (unpersisted) row carries. */
export const LIVE_EVENT_ID = EventIdSchema.make("LIVE0000000000000000000000");
/** Optimistic rows for a send the server hasn't admitted yet. */
export const PENDING_SEND_EVENT_ID = EventIdSchema.make(
  "PENDINGSEND000000000000000",
);
export const UPLOAD_SEND_EVENT_ID = EventIdSchema.make(
  "UPLOADSEND0000000000000000",
);
export const THINKING_STANDIN_ID = "live:thinking-standin";
export const COMPACTING_ID = "live:compacting";
/** Suffix of the hidden "still thinking" row the open turn gets after its last settled line. */
export const HIDDEN_SUFFIX = ":hidden";

type Settlement = typeof ToolSettlement.Type;

/** Fields Capy's builder adds on the client beyond the row schemas. */
export interface RowExtras {
  readonly writing?: boolean | undefined;
  readonly waitResolvedAt?: Date | undefined;
  readonly completions?: ReadonlyMap<number, Settlement> | undefined;
  readonly showFooter?: boolean | undefined;
  readonly expanded?: boolean | undefined;
  readonly members?: ReadonlyArray<unknown> | undefined;
  readonly sleptAfter?: boolean | undefined;
  readonly revised?: boolean | undefined;
  readonly terminal?: TerminalOutcome | undefined;
  readonly liveCalls?: ReadonlyArray<LiveCall> | undefined;
}

export interface LiveCall {
  readonly index: number;
  readonly phase: "forming" | "running" | "done" | "failed";
  readonly call: typeof ExecuteCall.Type;
}

export type TerminalOutcome =
  | { readonly outcome: "cancelled" | "done" | "expired" | "failed" }
  | { readonly outcome: "exited"; readonly exitCode: number | undefined };

/** A row as the builder carries it: a TimelineRow plus client-only fields. */
export type Row = TimelineRow & RowExtras;
export type RowOf<T extends Row["type"]> = Extract<Row, { type: T }>;
export type ActivityRow = RowOf<"activity">;
export type ToolRow = Extract<ActivityRow, { kind: "tool" }>;
export type ReasoningRow = Extract<ActivityRow, { kind: "reasoning" }>;
export type UpdateRow = RowOf<"update">;
export type { Settlement };

export const isTool = (row: Row | undefined): row is ToolRow =>
  row?.type === "activity" && row.kind === "tool";

export const asRecord = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

export const readString = (value: unknown, key: string): string | undefined => {
  const field = asRecord(value)[key];
  return typeof field === "string" && field.length > 0 ? field : undefined;
};

export const readNumber = (value: unknown, key: string): number | undefined => {
  const field = asRecord(value)[key];
  return typeof field === "number" && Number.isFinite(field) ? field : undefined;
};

export const readArray = (
  value: unknown,
  key: string,
): ReadonlyArray<unknown> => {
  const field = asRecord(value)[key];
  return Array.isArray(field) ? field : [];
};

export interface ProgramCall {
  readonly tool: string;
  readonly input: unknown;
  readonly data?: unknown;
  readonly error?: string | undefined;
}

/** The `execute` tool's result data: its program calls and an optional wait. */
export const executeData = (
  data: unknown,
):
  | {
      readonly calls: ReadonlyArray<ProgramCall>;
      readonly wait: { readonly description: string } | undefined;
    }
  | undefined => {
  const record = asRecord(data);
  if (!Array.isArray(record.calls) && record.wait === undefined) return undefined;
  const calls = readArray(record, "calls").flatMap((call) => {
    const tool = readString(call, "tool");
    return tool === undefined
      ? []
      : [
          {
            tool,
            input: asRecord(call).input,
            data: asRecord(call).data,
            error: readString(call, "error"),
          },
        ];
  });
  const description = readString(record.wait, "description");
  return {
    calls,
    wait: record.wait === undefined ? undefined : { description: description ?? "" },
  };
};

/** True when a tool parks the turn on a wait (`wait`, or `execute` that waited). */
export const isWaitTool = (toolName: string, data: unknown): boolean =>
  toolName === "wait" ||
  (toolName === "execute" && executeData(data)?.wait !== undefined);

/** `message_user`, and `message_agent` addressed to the parent (no `to`). */
export const isDeliveryTool = (toolName: string, args: unknown): boolean =>
  toolName === "message_user" ||
  (toolName === "message_agent" && readString(args, "to") === undefined &&
    typeof asRecord(args).to !== "string");

const deliveryStates: Record<string, "final" | "needs_you"> = {
  final: "final",
  finished: "final",
  ready_for_review: "final",
  waiting: "final",
  needs_you: "needs_you",
  pending_user: "needs_you",
};

export const deliveryState = (args: unknown) => {
  const state = readString(args, "state") ?? readString(args, "final_state");
  return state === undefined ? undefined : deliveryStates[state];
};

export const isFinalSlackReact = (toolName: string, args: unknown) =>
  toolName === "slack_react" &&
  asRecord(args).action !== "remove" &&
  asRecord(args).is_final === true;

export const MESSAGE_TOOLS = new Set(["message_user", "message_agent"]);
export const CARD_TOOLS = new Set([
  "clarify_questions",
  "environment_request_variables",
]);
export const MCP_TOOLS = new Set(["mcp_add", "mcp_update", "mcp_connect"]);
export const HIDDEN_TOOLS = new Set([
  "todo_write",
  "report_issue",
  "tool_search",
  "tool_search_tool_bm25",
  "tool_search_tool_regex",
]);
/** Tools whose success means the machine is up (settles a machine episode). */
export const MACHINE_TOOLS = new Set([
  "read",
  "bash",
  "edit",
  "write",
  "apply_patch",
  "computer",
  "browser",
  "desktop_info",
  "desktop_recording",
  "drive_checkout",
  "artifact_checkout",
  "drive_confirm_deletes",
  "port_list",
  "environment_get_setup",
  "environment_apply_setup",
  "memory_save",
]);
export const CLARIFY_TOOL = "clarify_questions";
export const ENV_REQUEST_TOOL = "environment_request_variables";
export const DESKTOP_REQUEST_TOOL = "request_desktop";
export const TERMINAL_REQUEST_TOOL = "request_terminal";
export const SETUP_TOOLS = new Set([
  "environment_apply_setup",
  "environment_build_snapshot",
  "environment_configure_snapshots",
]);

/** Unwraps Capy's `tool_call` indirection into the called tool. */
export const unwrapToolCall = (
  toolName: string,
  args: unknown,
): { toolName: string; args: unknown } => {
  if (toolName !== "tool_call") return { toolName, args };
  const name = readString(args, "name");
  return name === undefined ||
    name === "tool_call" ||
    MESSAGE_TOOLS.has(name) ||
    CARD_TOOLS.has(name)
    ? { toolName, args }
    : { toolName: name, args: asRecord(args).args };
};

/** The time a row's work ended: a settled tool's settle time, else its createdAt. */
export const settledAt = (row: Row): Date =>
  isTool(row) && row.result !== undefined && !isMachineUnavailable(row.result)
    ? row.result.settledAt
    : row.createdAt;

export const startOf = (row: { startedAt?: Date | undefined; createdAt: Date }) =>
  row.startedAt ?? row.createdAt;

const isMachineUnavailable = (result: Settlement) =>
  result.isError &&
  result.blocks.length === 1 &&
  result.blocks[0]?.type === "text" &&
  /^machine \S+ is not available(:|$)/i.test(
    (result.blocks[0] as { text: string }).text,
  );

export const joinText = (a: string, b: string) =>
  a.length === 0 ? b : b.length === 0 ? a : `${a}\n\n${b}`;

export const isLive = (eventId: EventId) => eventId === LIVE_EVENT_ID;
