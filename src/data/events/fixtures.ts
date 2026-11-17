import type { EventRowEncoded, EventStreamLine } from "./events";
import type { LiveDelta, RealtimeServerMessage } from "./live";
import type { TimelineRowEncoded } from "./rows";

/**
 * Deterministic, neutral sample data for every thread event kind, live delta,
 * realtime frame and timeline row. Nothing here comes from real threads.
 * Every value is in its encoded (wire / JSON) form, so tests and mock services
 * decode it through the same schemas the real client will use.
 */

const CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

const encodeBase32 = (value: number, length: number) => {
  let out = "";
  let rest = value;
  for (let i = 0; i < length; i += 1) {
    out = CROCKFORD[rest % 32] + out;
    rest = Math.floor(rest / 32);
  }
  return out;
};

export interface FixtureOptions {
  /** Thread id every event belongs to. */
  readonly jamId?: string;
  /** Timestamp of the first event, in ms. Each event is a few seconds after the last. */
  readonly startMs?: number;
}

type LiveDeltaEncoded = typeof LiveDelta.Encoded;
type StreamLineEncoded = typeof EventStreamLine.Encoded;
type ServerMessageEncoded = typeof RealtimeServerMessage.Encoded;

export const SAMPLE = {
  userId: "user_sample_alex",
  userName: "Alex Rivera",
  repo: "acme/todo-web",
  machineId: "machine_sample_01",
  childJamId: "jam_sample_child",
  fileId: "file_sample_01",
} as const;

const file = (name: string, mediaType: string, sizeBytes: number) => ({
  fileId: SAMPLE.fileId,
  name,
  mediaType,
  sizeBytes,
});

const web = {
  type: "web" as const,
  userId: SAMPLE.userId,
  authorName: SAMPLE.userName,
};
const userActor = { type: "user" as const, userId: SAMPLE.userId };
const systemActor = { type: "system" as const, service: "system" as const };
const sys = { type: "system" as const };

export const makeThreadFixtures = (options: FixtureOptions = {}) => {
  const jamId = options.jamId ?? "jam_sample_thread";
  const startMs = options.startMs ?? Date.UTC(2026, 10, 17, 9, 0, 0);
  let tick = 0;
  const next = () => {
    tick += 1;
    const ms = startMs + tick * 4_000;
    return {
      id: encodeBase32(ms, 10) + encodeBase32(tick, 16),
      at: new Date(ms).toISOString(),
    };
  };

  const event = <K extends EventRowEncoded["kind"]>(
    kind: K,
    payload: unknown,
    state: EventRowEncoded["state"] = "committed",
  ) => {
    const { id, at } = next();
    return {
      id,
      jamId,
      kind,
      state,
      createdAt: at,
      payload,
    } as EventRowEncoded;
  };

  const context = event("context", {
    actor: userActor,
    origin: web,
    provider: "automation",
    context: {
      automationId: "auto_sample_nightly",
      automationRunId: "run_sample_01",
      automationName: "Nightly dependency check",
      trigger: { kind: "schedule", occurrence: "2026-11-17T09:00:00Z" },
    },
  });

  const message = event("message", {
    actor: userActor,
    origin: web,
    text: "Add a dark mode toggle to the settings page and open a PR.",
    files: [file("settings-mock.png", "image/png", 48_213)],
    delivery: "queue",
    clientKey: "ck_sample_0001",
    model: { modelId: "anthropic/claude-sample", reasoningMode: "medium" },
    mentions: [
      {
        kind: "file",
        id: "src/settings.tsx",
        label: "settings.tsx",
        start: 30,
        end: 43,
        text: "settings page",
      },
    ],
  });

  const assistantBase = {
    actor: { type: "agent" as const, jamId },
    origin: sys,
    model: {
      modelId: "anthropic/claude-sample",
      providerModelId: "claude-sample",
      reasoningMode: "medium",
    },
    route: { source: "capy", providerId: "anthropic" },
    usage: {
      inputTokens: 1_840,
      outputTokens: 212,
      cacheReadTokens: 12_000,
      cacheWriteTokens: 0,
    },
    contextTokens: {
      system: 3_100,
      tools: 5_400,
      rules: 0,
      skills: 900,
      mcp: 0,
      environment: 600,
      conversation: 1_840,
    },
  };

  const toolCallId = "toolu_sample_bash_01";
  const assistantToolTurn = event("assistant", {
    ...assistantBase,
    stopReason: "tool_use",
    startedAt: new Date(startMs + 8_500).toISOString(),
    blocks: [
      {
        id: "blk_1",
        type: "thinking",
        text: "Find the settings page first.",
        presentation: "summary",
      },
      { id: "blk_2", type: "text", text: "Looking at the settings page." },
      {
        id: "blk_3",
        type: "tool_use",
        toolCallId,
        toolName: "bash",
        args: {
          command: "rg -n ThemeToggle src",
          description: "Searching for the toggle",
        },
      },
      {
        id: "blk_4",
        type: "fallback",
        provider: "anthropic",
        fromModel: "claude-sample",
        toModel: "claude-sample-lite",
      },
    ],
  });

  const toolResult = event("tool_result", {
    actor: { type: "agent" as const, jamId },
    origin: sys,
    assistantEventId: assistantToolTurn.id,
    toolCallId,
    isError: false,
    blocks: [
      { type: "text", text: "src/settings.tsx:12: <ThemeToggle />" },
      { type: "json", data: { exit_code: 0 } },
      { type: "hologram", frames: 3 },
    ],
    data: { exit_code: 0, duration_ms: 84 },
  });

  const assistantReply = event("assistant", {
    ...assistantBase,
    stopReason: "end_turn",
    blocks: [
      {
        id: "blk_5",
        type: "tool_use",
        toolCallId: "toolu_sample_reply_01",
        toolName: "message_user",
        args: { text: "PR is up with the toggle.", state: "final" },
      },
      { id: "blk_6", type: "redacted_thinking" },
    ],
  });

  const control = event("control", {
    actor: userActor,
    origin: web,
    command: { type: "compact" },
  });

  const compact = event("compact", {
    actor: systemActor,
    origin: sys,
    summary: "Added the dark mode toggle; PR open, CI running.",
    throughEventId: assistantReply.id,
    triggeredBy: "manual",
    tokensBefore: 182_000,
    todos: [{ content: "Wait for CI", status: "in_progress" }],
  });

  const notification = event("notification", {
    actor: { type: "system" as const, service: "github" as const },
    origin: {
      type: "github" as const,
      deliveryId: "dlv_sample_01",
      repoFullName: SAMPLE.repo,
      prNumber: 42,
    },
    key: "ci_result",
    summary: "CI passed on acme/todo-web#42",
    ciResult: {
      pull: `${SAMPLE.repo}#42`,
      outcome: "passed",
      headSha: "a1b2c3d",
    },
    ref: { kind: "pr", id: "42" },
  });

  const rule = event("rule", {
    actor: systemActor,
    origin: sys,
    rule: {
      type: "glob_rule",
      source: ".capy/rules/ui.md",
      content: "Use design tokens for every colour.",
      globs: ["src/**/*.tsx"],
      alwaysApply: false,
    },
  });

  const reviewRequest = event("review_request", {
    actor: { type: "system" as const, service: "github" as const },
    origin: sys,
    repoFullName: SAMPLE.repo,
    prNumber: 42,
    headSha: "a1b2c3d4e5f6",
    baseSha: "0f9e8d7c6b5a",
    baseRef: "main",
    trigger: "automatic",
    priorFindings: [
      {
        id: "fnd_sample_01",
        status: "open",
        severity: "low",
        summary: "Toggle lacks an aria-label",
        file: "src/settings.tsx",
        line: 12,
      },
    ],
  });

  const taskCompletion = event("task_completion", {
    actor: { type: "agent" as const, jamId: SAMPLE.childJamId },
    origin: {
      type: "agent" as const,
      jamId: SAMPLE.childJamId,
      relation: { type: "parent" as const },
    },
    childJamId: SAMPLE.childJamId,
    localIndex: 1,
    outcome: "completed",
    summary: "Wrote the toggle tests; all 12 pass.",
    deliveryState: "final",
    attachments: [
      { file: file("coverage.txt", "text/plain", 1_204), title: "Coverage" },
    ],
  });

  const operationCompletion = event("operation_completion", {
    actor: systemActor,
    origin: { type: "vm" as const, machineId: SAMPLE.machineId },
    operationId: "op_sample_build",
    toolCallId: "toolu_sample_build_01",
    blocks: [
      { type: "text", text: "vite v8 building for production... done in 4.2s" },
    ],
    isError: false,
    exitCode: 0,
  });

  const error = event("error", {
    actor: systemActor,
    origin: sys,
    code: "provider_overloaded",
    message: "The model provider is overloaded. Capy will retry shortly.",
    retryable: true,
  });

  const handoff = event("handoff", {
    actor: userActor,
    origin: web,
    handoffId: `hnd_${encodeBase32(startMs, 10)}0000000000000000`,
    direction: "device_to_cloud",
    trigger: "user",
    source: {
      machineId: "machine_sample_laptop",
      deviceName: "Sample laptop",
      workspaceRoot: "/home/sample/todo-web",
    },
    destination: {
      machineId: SAMPLE.machineId,
      workspaceRoot: "/workspace/todo-web",
    },
    snapshot: { id: "snap_sample_01", capturedAt: startMs, ageMs: 1_200 },
    repos: [
      {
        dir: "todo-web",
        branch: "feature/dark-mode",
        head: "a1b2c3d4e5f6",
        counts: {
          staged: 0,
          unstaged: 2,
          untracked: 1,
          ignored: 0,
          aheadOfBase: 1,
        },
        overCap: [],
      },
    ],
    outsideRoot: "not transferred",
    result: { kind: "verified" },
  });

  const mobileSession = event("mobile_session", {
    actor: userActor,
    origin: web,
    sessionId: `${encodeBase32(startMs, 10)}MOBILE0000000000`,
    platform: "ios",
    appName: "Todo",
    deviceModel: "iPhone Sample",
    status: "active",
  });

  const legacy = event("legacy", {
    actor: systemActor,
    origin: sys,
    archiveRef: "archive/sample-01",
    eventCount: 214,
  });

  const threadCompletion = event("thread_completion", {
    actor: { type: "agent" as const, jamId: SAMPLE.childJamId },
    origin: sys,
    childJamId: SAMPLE.childJamId,
    threadCode: "TODO-12",
    title: "Dark mode toggle",
    outcome: "completed",
    summary: "PR #42 is ready for review.",
    deliveryState: "needs_you",
    ask: "Review PR #42",
    needs: "person",
    pullRequests: [{ repoFullName: SAMPLE.repo, prNumber: 42, state: "ready" }],
  });

  const pendingMessage = event(
    "message",
    {
      actor: userActor,
      origin: web,
      text: "Also add it to the mobile menu.",
      files: [],
      delivery: "steer",
      clientKey: "ck_sample_0002",
    },
    "pending",
  );

  const unknownKind = (() => {
    const { id, at } = next();
    return {
      id,
      jamId,
      kind: "hologram_projection",
      state: "committed",
      createdAt: at,
      payload: { beam: 1 },
    };
  })();

  const events = [
    context,
    message,
    assistantToolTurn,
    toolResult,
    rule,
    assistantReply,
    notification,
    reviewRequest,
    taskCompletion,
    operationCompletion,
    error,
    control,
    compact,
    handoff,
    mobileSession,
    legacy,
    threadCompletion,
    pendingMessage,
  ];

  const lastId = events[events.length - 1]?.id ?? null;
  const streamLines: StreamLineEncoded[] = [
    { kind: "page", serverNow: new Date(startMs + 120_000).toISOString() },
    ...events.map((item) => ({ kind: "event" as const, item })),
    {
      kind: "end",
      cursor: lastId,
      avatarUrls: { [SAMPLE.userId]: "https://example.com/avatar.png" },
    },
  ];

  const liveTurn: LiveDeltaEncoded[] = [
    { type: "run-start" },
    { type: "turn-start" },
    { type: "llm-event", event: { type: "step-start", index: 0 } },
    { type: "llm-event", event: { type: "reasoning-start", id: "r1" } },
    {
      type: "llm-event",
      event: {
        type: "reasoning-delta",
        id: "r1",
        text: "Check the theme hook.",
      },
    },
    { type: "llm-event", event: { type: "reasoning-end", id: "r1" } },
    { type: "llm-event", event: { type: "text-start", id: "t1" } },
    {
      type: "llm-event",
      event: { type: "text-delta", id: "t1", text: "Running the " },
    },
    {
      type: "llm-event",
      event: { type: "text-delta", id: "t1", text: "tests now." },
    },
    { type: "llm-event", event: { type: "text-end", id: "t1" } },
    {
      type: "llm-event",
      event: { type: "tool-input-start", id: "toolu_live_01", name: "execute" },
    },
    {
      type: "llm-event",
      event: {
        type: "tool-input-delta",
        id: "toolu_live_01",
        name: "execute",
        text: '{"code":"await tools',
      },
    },
    {
      type: "llm-event",
      event: { type: "tool-input-end", id: "toolu_live_01", name: "execute" },
    },
    {
      type: "llm-event",
      event: {
        type: "tool-call",
        id: "toolu_live_01",
        name: "execute",
        input: { code: "await tools.capy.bash({})" },
      },
    },
    {
      type: "tool-activity",
      toolCallId: "toolu_live_01",
      calls: [
        {
          index: 0,
          phase: "running",
          call: { tool: "capy.bash", input: { command: "bun test" } },
        },
      ],
    },
    {
      type: "tool-activity",
      toolCallId: "toolu_live_01",
      calls: [
        {
          index: 0,
          phase: "done",
          call: {
            tool: "capy.bash",
            input: { command: "bun test" },
            durationMs: 3_200,
          },
        },
      ],
    },
    {
      type: "upload-progress",
      toolCallId: "toolu_live_02",
      files: [{ index: 0, loaded: 24_000, total: 48_213 }],
    },
    {
      type: "file-uploaded",
      toolCallId: "toolu_live_02",
      index: 0,
      file: file("screenshot.png", "image/png", 48_213),
    },
    {
      type: "transfer-progress",
      toolCallId: "toolu_live_03",
      step: "sending",
      loaded: 10,
      total: 40,
    },
    {
      type: "llm-event",
      event: {
        type: "fallback",
        provider: "anthropic",
        fromModel: "claude-sample",
        toModel: "claude-sample-lite",
      },
    },
    {
      type: "llm-event",
      event: {
        type: "step-finish",
        index: 0,
        reason: "tool-calls",
        usage: { inputTokens: 900, outputTokens: 80 },
      },
    },
    { type: "llm-event", event: { type: "finish", reason: "stop" } },
    { type: "turn-end", outcome: "settled" },
    { type: "compaction-start" },
    { type: "run-end", status: "idle" },
  ];

  const unknownDelta = { type: "hologram-delta", beam: 1 };

  const realtimeFrames: ServerMessageEncoded[] = [
    { type: "subscribed", scopes: [`jam:${jamId}`] },
    {
      type: "hint",
      table: "jam_event",
      op: "insert",
      scopes: { jamId, rootJamId: jamId },
      changedColumns: [],
      sourceId: lastId ?? undefined,
    },
    ...liveTurn.map((delta) => ({ type: "delta" as const, jamId, delta })),
    { type: "pong", sentAt: startMs, serverTime: startMs + 12 },
  ];

  const at = (offsetMs: number) => new Date(startMs + offsetMs).toISOString();
  const rowBase = (id: string, offsetMs: number) => ({
    id,
    eventId: message.id,
    createdAt: at(offsetMs),
  });
  const activity = { turnOpen: false, turnCloses: false, startedAt: at(9_000) };
  const toolActivity = {
    ...rowBase(toolCallId, 9_000),
    ...activity,
    type: "activity" as const,
    kind: "tool" as const,
    toolName: "bash",
    args: { command: "rg -n ThemeToggle src" },
    phase: "done" as const,
    result: {
      blocks: [{ type: "text" as const, text: "src/settings.tsx:12" }],
      isError: false,
      settledAt: at(9_400),
    },
  };
  const taskUpdate = {
    ...rowBase("upd_task", 40_000),
    type: "update" as const,
    kind: "task" as const,
    childJamId: SAMPLE.childJamId,
    reference: { kind: "task" as const, localIndex: 1 },
    outcome: "completed" as const,
    summary: "Wrote the toggle tests; all 12 pass.",
    attachments: [],
  };
  const noticeUpdate = {
    ...rowBase("upd_notice", 41_000),
    type: "update" as const,
    kind: "notice" as const,
    notificationKey: "ci_result",
    summary: "CI passed on acme/todo-web#42",
    ciResult: { pull: `${SAMPLE.repo}#42`, outcome: "passed" },
  };

  const rows: TimelineRowEncoded[] = [
    {
      ...rowBase(message.id, 4_000),
      type: "user-message",
      text: "Add a dark mode toggle to the settings page and open a PR.",
      mentions: [],
      files: [file("settings-mock.png", "image/png", 48_213)],
      delivery: "queue",
      actor: userActor,
      origin: web,
      showOrigin: false,
      state: "answered",
      clientKey: "ck_sample_0001",
    },
    {
      ...rowBase("act_text", 8_600),
      ...activity,
      type: "activity",
      kind: "text",
      text: "Looking at the settings page.",
    },
    {
      ...rowBase("act_reasoning", 8_500),
      ...activity,
      type: "activity",
      kind: "reasoning",
      text: "Find the settings page first.",
      presentation: "summary",
      elapsedMs: 1_800,
    },
    toolActivity,
    {
      ...rowBase("act_forming", 9_100),
      ...activity,
      turnOpen: true,
      type: "activity",
      kind: "tool",
      toolName: "execute",
      args: {},
      phase: "running",
      liveCalls: [
        {
          index: 0,
          phase: "running",
          call: { tool: "capy.bash", input: { command: "bun test" } },
        },
      ],
    },
    {
      ...rowBase("act_fallback", 9_200),
      ...activity,
      type: "activity",
      kind: "fallback",
      provider: "anthropic",
      fromModel: "claude-sample",
      toModel: "claude-sample-lite",
    },
    {
      ...rowBase("act_wire", 9_300),
      ...activity,
      type: "activity",
      kind: "wire",
      text: "This endpoint rejected adaptive thinking",
    },
    {
      ...rowBase("msg_agent", 20_000),
      type: "agent-message",
      startedAt: at(19_000),
      settled: true,
      interrupted: false,
      turnCloses: true,
      text: "PR is up with the toggle: **acme/todo-web#42**.",
      files: [],
      uploads: [],
      placed: [],
      placing: [],
      modelId: "anthropic/claude-sample",
      reasoningMode: "medium",
    },
    {
      ...rowBase("work_1", 9_000),
      type: "work-group",
      activeMs: 64_000,
      failures: [],
      entries: [toolActivity],
      chunks: [],
      live: false,
      expanded: false,
    },
    ...[
      ["compaction", "Compacted from 182K tokens"],
      ["handoff", "Moved to cloud"],
      ["new", "New"],
      ["machine", "Machine reconnected after 2m"],
      ["fork", "Side thread of"],
      ["review", "Reviewing push a1b2c3d"],
    ].map(
      ([kind, label], index) =>
        ({
          ...rowBase(`marker:${index}`, 30_000 + index),
          type: "marker",
          kind,
          label,
        }) as TimelineRowEncoded,
    ),
    noticeUpdate,
    taskUpdate,
    {
      ...rowBase("upd_review", 42_000),
      type: "update",
      kind: "review",
      prNumber: 42,
      issues: 1,
    },
    {
      ...rowBase("upd_op", 43_000),
      type: "update",
      kind: "operation",
      operationId: "op_sample_build",
      toolCallId: "toolu_sample_build_01",
      blocks: [{ type: "text", text: "build done in 4.2s" }],
      isError: false,
      commandLabel: "bun run build",
    },
    {
      ...rowBase("cluster_1", 44_000),
      type: "cluster",
      members: [
        noticeUpdate,
        { ...noticeUpdate, id: "upd_notice_2", summary: "CI passed again" },
      ],
      expanded: false,
    },
    {
      ...rowBase("err_1", 45_000),
      type: "error",
      severity: "warning",
      code: "provider_overloaded",
      message: "The model provider is overloaded. Capy will retry shortly.",
      retryable: true,
    },
    {
      ...rowBase("visual:toolu_vis", 46_000),
      type: "visual",
      toolCallId: "toolu_vis",
      title: "Bundle size by route",
      html: "<div>chart</div>",
    },
    {
      ...rowBase("summary:1", 47_000),
      type: "summary",
      prs: [
        {
          kind: "pr",
          number: 42,
          url: "https://github.com/acme/todo-web/pull/42",
          alreadyExists: false,
        },
      ],
      ports: [
        {
          kind: "port",
          title: "Dev server",
          machineId: SAMPLE.machineId,
          port: 5173,
        },
      ],
      environmentRequests: [],
      setup: [],
      automations: [],
      appearances: [],
    },
    {
      ...rowBase("toolu_clarify", 48_000),
      type: "clarify",
      turnCloses: true,
      questions: [
        {
          question: "Where should the toggle live?",
          options: ["Settings", "Top bar"],
          multiSelect: false,
        },
      ],
    },
    {
      ...rowBase("toolu_env", 49_000),
      type: "environment-request",
      turnCloses: true,
      request: {
        toolCallId: "toolu_env",
        variables: ["SAMPLE_API_KEY"],
        reason: "Needed to run the e2e suite",
      },
      fulfilled: false,
      repliedPast: false,
    },
    {
      ...rowBase("toolu_desk", 50_000),
      type: "desktop-request",
      turnCloses: true,
      toolCallId: "toolu_desk",
      assistantEventId: assistantToolTurn.id,
      reason: "Sign in to the sample dashboard, then press Done",
      machine: { machineId: SAMPLE.machineId },
      state: "pending",
      repliedPast: false,
    },
    {
      ...rowBase("toolu_term", 51_000),
      type: "terminal-request",
      turnCloses: true,
      toolCallId: "toolu_term",
      assistantEventId: assistantToolTurn.id,
      command: "gh auth login",
      reason: "Sign in to GitHub, then press Done",
      machine: { machineId: SAMPLE.machineId },
      repliedPast: false,
    },
    {
      ...rowBase("toolu_fb", 52_000),
      type: "feedback-request",
      turnCloses: true,
      toolCallId: "toolu_fb",
      assistantEventId: assistantToolTurn.id,
    },
    {
      ...rowBase("toolu_mcp", 53_000),
      type: "mcp-setup",
      turnCloses: true,
      assistantEventId: assistantToolTurn.id,
      toolResultEventId: toolResult.id,
      toolCallId: "toolu_mcp",
      proposal: { request: "add", name: "Sample docs" },
    },
    {
      ...rowBase("phone_1", 54_000),
      type: "phone-card",
      machineId: SAMPLE.machineId,
      summary: "Phone attached to the sample machine",
    },
    {
      ...rowBase("mobile_1", 55_000),
      type: "mobile-session",
      sessionId: "MOBILE0000000000000000000A",
      platform: "ios",
      appName: "Todo",
      status: "active",
    },
  ];

  return {
    jamId,
    events,
    unknownKind,
    streamLines,
    liveTurn,
    unknownDelta,
    realtimeFrames,
    rows,
  };
};

export type ThreadFixtures = ReturnType<typeof makeThreadFixtures>;
