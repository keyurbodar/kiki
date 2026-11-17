import type { EventRowEncoded } from "@/data/events/events";
import {
  NOTIFICATION_KEYS,
  type NotificationKey,
} from "@/data/events/payloads";

export interface ThreadSample {
  readonly id: string;
  readonly title: string;
  readonly events: readonly EventRowEncoded[];
}

const system = { type: "system" as const, service: "system" as const };
const github = { type: "system" as const, service: "github" as const };
const vm = { type: "system" as const, service: "vm" as const };
const machine = { type: "vm" as const, machineId: "machine_sample_build" };
const web = { type: "web" as const };

const user = (index: number) => ({
  type: "user" as const,
  userId: `user_sample_${index}`,
});

const agent = (jamId: string) => ({
  type: "agent" as const,
  jamId,
});

const file = (name: string, mediaType: string, sizeBytes: number) => ({
  fileId: "file_sample_shared",
  name,
  mediaType,
  sizeBytes,
});

/** Deterministic 26-character ids: ten base-32 time digits plus a six-digit counter. */
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

const base32 = (value: number, length: number) => {
  let output = "";
  let rest = value;
  for (let index = 0; index < length; index += 1) {
    output = ALPHABET[rest % 32] + output;
    rest = Math.floor(rest / 32);
  }
  return output;
};

const row = (
  jamId: string,
  sequence: number,
  kind: EventRowEncoded["kind"],
  payload: object,
  state: EventRowEncoded["state"] = "committed",
): EventRowEncoded => {
  const ms = Date.UTC(2026, 10, 17, 9, 0, 0) + sequence * 5_000;
  return {
    id: base32(ms, 10) + base32(sequence, 16),
    jamId,
    kind,
    state,
    createdAt: new Date(ms).toISOString(),
    payload,
  } as EventRowEncoded;
};

const message = (
  jamId: string,
  sequence: number,
  text: string,
  person: number,
  extra: object = {},
) =>
  row(jamId, sequence, "message", {
    actor: user(person),
    origin: web,
    text,
    files: [],
    delivery: "queue",
    ...extra,
  });

const notification = (
  jamId: string,
  sequence: number,
  key: NotificationKey,
  summary: string,
  extra: object = {},
) =>
  row(jamId, sequence, "notification", {
    actor: system,
    origin: { type: "system" },
    key,
    summary,
    ...extra,
  });

const turn = (
  jamId: string,
  sequence: number,
  toolCallId: string,
  toolName: string,
  args: object,
  before: object[] = [],
) =>
  row(jamId, sequence, "assistant", {
    actor: agent(jamId),
    origin: { type: "system" },
    model: {
      modelId: "anthropic/claude-sample",
      providerModelId: "claude-sample",
    },
    route: { source: "capy" },
    usage: {
      inputTokens: 1_200,
      outputTokens: 240,
      cacheReadTokens: 0,
      cacheWriteTokens: 0,
    },
    stopReason: "tool_use",
    blocks: [
      ...before,
      { id: `blk_${sequence}`, type: "tool_use", toolCallId, toolName, args },
    ],
  });

const toolResult = (
  jamId: string,
  sequence: number,
  toolCallId: string,
  isError: boolean,
  text: string,
  extra: object = {},
) =>
  row(jamId, sequence, "tool_result", {
    actor: agent(jamId),
    origin: { type: "system" },
    toolCallId,
    isError,
    blocks: [{ type: "text", text }],
    ...extra,
  });

const reply = (jamId: string, sequence: number, text: string) =>
  row(jamId, sequence, "assistant", {
    actor: agent(jamId),
    origin: { type: "system" },
    model: {
      modelId: "anthropic/claude-sample",
      providerModelId: "claude-sample",
    },
    route: { source: "capy" },
    usage: {
      inputTokens: 1_100,
      outputTokens: 180,
      cacheReadTokens: 0,
      cacheWriteTokens: 0,
    },
    stopReason: "end_turn",
    blocks: [{ id: `blk_${sequence}`, type: "text", text }],
  });

/* 1. Adding a filter to a todo app: message, context, rule, tool call, polished reply. */
const todoJam = "jam_sample_todo_filter";

const todoFilter: ThreadSample = {
  id: "todo-filter",
  title: "Todo app filter",
  events: [
    message(todoJam, 1, "Add a filter for completed tasks.", 1),
    row(todoJam, 2, "context", {
      actor: user(1),
      origin: web,
      provider: "automation",
      context: {
        automationId: "auto_sample_filters",
        automationRunId: "run_sample_filters",
        automationName: "Weekly task review",
        trigger: { kind: "schedule", occurrence: "2026-11-16T09:00:00Z" },
      },
    }),
    row(todoJam, 3, "rule", {
      actor: system,
      origin: { type: "system" },
      rule: {
        type: "glob_rule",
        source: ".capy/rules/frontend.md",
        content: "Keep components small and name props explicitly.",
        globs: ["src/**/*.tsx"],
        alwaysApply: false,
      },
    }),
    turn(todoJam, 4, "toolu_sample_read", "read", {
      path: "src/components/TodoList.tsx",
    }),
    toolResult(todoJam, 5, "toolu_sample_read", false, "Read 84 lines."),
    ...NOTIFICATION_KEYS.map((key, index) =>
      notification(
        todoJam,
        index + 7,
        key,
        `Todo app notice: ${key.replaceAll("_", " ")}`,
      ),
    ),
    reply(
      todoJam,
      7 + NOTIFICATION_KEYS.length,
      "The filter now lives above the list and keeps its state in the URL.",
    ),
  ],
};

/* 2. CLI docs: successful and failed tool results, a review request and a notification. */
const cliJam = "jam_sample_cli_docs";

const cliDocs: ThreadSample = {
  id: "cli-docs",
  title: "CLI docs site",
  events: [
    message(cliJam, 1, "Document the new --json flag.", 2, {
      files: [file("flag-help.txt", "text/plain", 640)],
    }),
    turn(cliJam, 2, "toolu_sample_tests", "bash", {
      command: "bun test docs",
    }),
    toolResult(cliJam, 3, "toolu_sample_tests", false, "12 tests passed.", {
      data: { exit_code: 0 },
    }),
    turn(cliJam, 4, "toolu_sample_linkcheck", "bash", {
      command: "bun run check:links",
    }),
    toolResult(
      cliJam,
      5,
      "toolu_sample_linkcheck",
      true,
      "Two links returned 404.",
      {
        data: { exit_code: 1 },
      },
    ),
    row(cliJam, 6, "review_request", {
      actor: github,
      origin: { type: "system" },
      repoFullName: "acme/cli-docs",
      prNumber: 12,
      headSha: "sampleheadsha",
      baseSha: "samplebasesha",
      baseRef: "main",
      trigger: "automatic",
    }),
    notification(cliJam, 7, "ci_result", "CI passed on acme/cli-docs#12", {
      actor: github,
      origin: {
        type: "github",
        deliveryId: "dlv_sample_cli",
        repoFullName: "acme/cli-docs",
        prNumber: 12,
      },
      ciResult: {
        pull: "acme/cli-docs#12",
        outcome: "passed",
        headSha: "sampleheadsha",
      },
      ref: { kind: "pr", id: "12" },
    }),
    reply(
      cliJam,
      8,
      "The flag is documented and the broken links are listed in the PR.",
    ),
  ],
};

/* 3. Compaction after a long todo-app exchange, with a background operation settling. */
const compactJam = "jam_sample_todo_compaction";
const compactionPrompt = message(
  compactJam,
  1,
  "Keep going until the todo app tests all pass.",
  3,
);

const controlCases = [
  { type: "promote_captain" as const, name: "Build" },
  { type: "demote_captain" as const, name: "Build" },
  { type: "rename_captain" as const, from: "Build", name: "Runner" },
  { type: "stop" as const },
  { type: "retry" as const },
  {
    type: "permission_decision" as const,
    toolCallId: "toolu_sample_permission",
    decision: "approve" as const,
  },
  {
    type: "cancel_input" as const,
    targetEventId: "00000000000000000000000001",
  },
  { type: "compact" as const },
  {
    type: "switch_version" as const,
    targetEventId: "00000000000000000000000001",
  },
];

const contextCases = [
  {
    kind: "takeover" as const,
    takerUserId: "user_sample_9",
    previousUserId: "user_sample_8",
    previousUserType: "human" as const,
  },
  { kind: "archive" as const, reason: "idle" as const, idleDays: 14 },
  {
    kind: "access" as const,
    change: "shared" as const,
    byUserId: "user_sample_8",
  },
  {
    kind: "side_thread" as const,
    sourceJamId: "jam_sample_side",
    sourceTitle: "Follow-up",
    participants: [],
    messages: [],
    forwardedFiles: [],
  },
];

const todoCompaction: ThreadSample = {
  id: "todo-compaction",
  title: "Todo app compaction",
  events: [
    compactionPrompt,
    row(compactJam, 2, "control", {
      actor: user(3),
      origin: web,
      command: { type: "compact" },
    }),
    reply(
      compactJam,
      3,
      "Compacting the earlier exploration before continuing.",
    ),
    row(compactJam, 4, "compact", {
      actor: system,
      origin: { type: "system" },
      summary: "The list view is done; the remaining work is the empty state.",
      throughEventId: compactionPrompt.id,
      triggeredBy: "manual",
      tokensBefore: 148_000,
      todos: [{ content: "Add the empty state", status: "in_progress" }],
    }),
    row(compactJam, 5, "operation_completion", {
      actor: system,
      origin: machine,
      operationId: "op_sample_todo_build",
      toolCallId: "toolu_sample_build",
      blocks: [{ type: "text", text: "bun run build finished" }],
      isError: false,
      exitCode: 0,
    }),
    ...controlCases.map((command, index) =>
      row(compactJam, index + 7, "control", {
        actor: user(3),
        origin: web,
        command,
      }),
    ),
    ...contextCases.map((context, index) =>
      row(compactJam, index + 7 + controlCases.length, "context", {
        actor: user(3),
        origin: web,
        provider: "web",
        context,
      }),
    ),
    reply(
      compactJam,
      7 + controlCases.length + contextCases.length,
      "The build is clean. Next I will add the empty state.",
    ),
  ],
};

/* 4. Subagent and crew reports for a docs site, plus an async error. */
const docsJam = "jam_sample_docs_reports";
const docsChild = "jam_sample_docs_child";

const docsReports: ThreadSample = {
  id: "docs-reports",
  title: "Docs site reports",
  events: [
    message(docsJam, 1, "Rewrite the getting-started guide.", 4),
    row(docsJam, 2, "task_completion", {
      actor: agent(docsChild),
      origin: { type: "agent", jamId: docsChild, relation: { type: "parent" } },
      childJamId: docsChild,
      localIndex: 1,
      outcome: "completed",
      summary: "Rewrote the guide with a shorter quickstart.",
      deliveryState: "final",
    }),
    row(docsJam, 3, "thread_completion", {
      actor: agent("jam_sample_docs_crew"),
      origin: { type: "system" },
      childJamId: "jam_sample_docs_crew",
      threadCode: "DOC-8",
      title: "Navigation cleanup",
      outcome: "completed",
      summary: "Navigation links now match the new guide.",
      deliveryState: "needs_you",
      needs: "captain",
      ask: "Review the navigation change",
      pullRequests: [
        { repoFullName: "acme/docs-site", prNumber: 21, state: "ready" },
      ],
    }),
    turn(docsJam, 4, "toolu_sample_port", "expose_port", {
      port: 4173,
      title: "Docs preview",
      machineId: "machine_sample_build",
    }),
    toolResult(
      docsJam,
      5,
      "toolu_sample_port",
      false,
      "Docs preview published.",
      {
        data: {
          port: 4173,
          title: "Docs preview",
          machineId: "machine_sample_build",
        },
      },
    ),
    row(docsJam, 6, "error", {
      actor: system,
      origin: { type: "system" },
      code: "preview_unavailable",
      message: "The preview server stopped while rendering the guide.",
      retryable: true,
    }),
    reply(docsJam, 7, "Both reports are in; the preview error is retryable."),
  ],
};

/* 5. Assistant takeovers: clarify request and environment request. */
const takeoverJam = "jam_sample_takeovers";

const takeovers: ThreadSample = {
  id: "takeovers",
  title: "CLI tool takeovers",
  events: [
    message(takeoverJam, 1, "Add an export command to the CLI.", 5),
    turn(takeoverJam, 2, "toolu_sample_clarify", "ask_user", {
      questions: [
        {
          question: "Which format should the export command write?",
          options: ["CSV", "JSON"],
          multiSelect: false,
        },
      ],
    }),
    notification(
      takeoverJam,
      3,
      "credits_waiting",
      "Credits are waiting on an answer",
      {
        actor: { type: "system" as const, service: "system" as const },
        creditsDecision: "ask",
      },
    ),
    row(takeoverJam, 4, "assistant", {
      actor: agent(takeoverJam),
      origin: { type: "system" },
      model: {
        modelId: "anthropic/claude-sample",
        providerModelId: "claude-sample",
      },
      route: { source: "capy" },
      usage: {
        inputTokens: 900,
        outputTokens: 140,
        cacheReadTokens: 0,
        cacheWriteTokens: 0,
      },
      stopReason: "tool_use",
      blocks: [
        {
          id: "blk_sample_env",
          type: "tool_use",
          toolCallId: "toolu_sample_env",
          toolName: "request_environment",
          args: {
            variables: ["SAMPLE_EXPORT_TOKEN"],
            reason: "The export integration needs a token.",
          },
        },
      ],
    }),
    notification(
      takeoverJam,
      5,
      "environment_variables_updated",
      "SAMPLE_EXPORT_TOKEN configured",
      {
        environmentVariablesUpdated: {
          action: "configured",
          scope: "thread",
          names: ["SAMPLE_EXPORT_TOKEN"],
        },
      },
    ),
    reply(
      takeoverJam,
      6,
      "Ready to implement once you choose the export format.",
    ),
  ],
};

/* 6. Workspace moves and legacy events for a todo app. */
const moveJam = "jam_sample_todo_move";

const workspaceMove: ThreadSample = {
  id: "workspace-move",
  title: "Todo app workspace move",
  events: [
    message(moveJam, 1, "Move this thread to the cloud and keep working.", 6),
    row(moveJam, 2, "handoff", {
      actor: user(6),
      origin: web,
      handoffId: "hnd_00000000000000000000000000",
      direction: "device_to_cloud",
      trigger: "user",
      source: {
        machineId: "machine_sample_device",
        deviceName: "Sample laptop",
        workspaceRoot: "/home/sample/todo-app",
      },
      destination: {
        machineId: "machine_sample_cloud",
        workspaceRoot: "/workspace/todo-app",
      },
      snapshot: {
        id: "snap_sample_move",
        capturedAt: Date.UTC(2026, 10, 17, 9, 0, 0),
        ageMs: 400,
      },
      repos: [
        {
          dir: "todo-app",
          head: "sampleheadsha",
          counts: {
            staged: 0,
            unstaged: 1,
            untracked: 0,
            ignored: 0,
            aheadOfBase: 0,
          },
          overCap: [],
        },
      ],
      outsideRoot: "not transferred",
      result: { kind: "verified" },
    }),
    row(moveJam, 3, "mobile_session", {
      actor: user(6),
      origin: web,
      sessionId: "00000000000000000000000000",
      platform: "android",
      appName: "Todo",
      status: "active",
    }),
    row(moveJam, 4, "legacy", {
      actor: system,
      origin: { type: "system" },
      archiveRef: "archive/sample-todo",
      eventCount: 18,
    }),
    row(moveJam, 5, "notification", {
      actor: vm,
      origin: machine,
      key: "machine_recovered",
      summary: "Build machine recovered",
      machineEpisode: { machineId: "machine_sample_cloud", cause: "reach" },
    }),
    row(moveJam, 6, "notification", {
      actor: vm,
      origin: machine,
      key: "machine_unavailable",
      summary: "Build machine went offline",
      severity: "warning",
      machineEpisode: { machineId: "machine_sample_cloud", cause: "reach" },
    }),
    row(moveJam, 7, "handoff", {
      actor: user(6),
      origin: web,
      handoffId: "hnd_00000000000000000000000002",
      direction: "cloud_to_device",
      trigger: "user",
      source: {
        machineId: "machine_sample_cloud",
        workspaceRoot: "/workspace/todo-app",
      },
      destination: {
        machineId: "machine_sample_device",
        workspaceRoot: "/home/sample/todo-app",
      },
      snapshot: {
        id: "snap_sample_return",
        capturedAt: Date.UTC(2026, 10, 17, 9, 0, 0),
        ageMs: 500,
      },
      repos: [
        {
          dir: "todo-app",
          head: "sampleheadsha",
          counts: {
            staged: 0,
            unstaged: 0,
            untracked: 0,
            ignored: 0,
            aheadOfBase: 0,
          },
          overCap: [],
        },
      ],
      outsideRoot: "not transferred",
      result: { kind: "verified" },
    }),
    reply(
      moveJam,
      9,
      "The thread returned to the laptop; the offline notice was a stale health check.",
    ),
  ],
};

export const samples: readonly ThreadSample[] = [
  todoFilter,
  cliDocs,
  todoCompaction,
  docsReports,
  takeovers,
  workspaceMove,
];
