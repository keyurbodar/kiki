import type { EventRowEncoded } from "@/data/events";
import { threads } from "../fixtures/world.ts";
import { eventId } from "./event-ids.ts";

/**
 * Thread route seeds for states the transcript builder derives into distinct
 * rows. Encoded EventRows, so tests decode them with the A8 schemas before the
 * mock serves them. Neutral sample projects only.
 */

const web = { type: "web" as const };
const sys = { type: "system" as const };
const system = { type: "system" as const, service: "system" as const };
const user = { type: "user" as const, userId: "user_sample_alex" };
const userSam = { type: "user" as const, userId: "user_sample_sam" };
const github = { type: "system" as const, service: "github" as const };
const file = (name: string) => ({
  fileId: "file_sample_thread_state",
  name,
  mediaType: "text/plain",
  sizeBytes: 512,
});

const row = (
  jamId: string,
  sequence: number,
  kind: EventRowEncoded["kind"],
  payload: object,
  state: EventRowEncoded["state"] = "committed",
): EventRowEncoded => {
  const ms = Date.UTC(2026, 10, 17, 9, 0, 0) + sequence * 5_000;
  return {
    id: eventId(ms, sequence, threadIds[jamId as keyof typeof threadIds] ?? 0),
    jamId,
    kind,
    state,
    createdAt: new Date(ms).toISOString(),
    payload,
  } as EventRowEncoded;
};

const prompt = (jamId: string, sequence: number, text: string, person = user) =>
  row(
    jamId,
    sequence,
    "message",
    {
      actor: person,
      origin: web,
      text,
      files: [],
      delivery: "queue",
    },
    "answered",
  );

const turn = (
  jamId: string,
  sequence: number,
  toolCallId: string,
  toolName: string,
  args: object,
  blocks: object[] = [],
) =>
  row(jamId, sequence, "assistant", {
    actor: { type: "agent", jamId },
    origin: sys,
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
      ...blocks,
      { id: `blk_${sequence}`, type: "tool_use", toolCallId, toolName, args },
    ],
  });

const result = (
  jamId: string,
  sequence: number,
  toolCallId: string,
  data: object,
  text: string,
  isError = false,
) =>
  row(jamId, sequence, "tool_result", {
    actor: { type: "agent", jamId },
    origin: sys,
    toolCallId,
    isError,
    blocks: [{ type: "text", text }],
    data,
  });

const reply = (jamId: string, sequence: number, text: string) =>
  row(jamId, sequence, "assistant", {
    actor: { type: "agent", jamId },
    origin: sys,
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

const threadIds = {
  [threads.rateLimit.id]: 1,
  [threads.checkoutTest.id]: 2,
  [threads.darkMode.id]: 3,
  [threads.bundler.id]: 4,
  [threads.paginate.id]: 5,
  [threads.gettingStarted.id]: 6,
  [threads.incidents.id]: 7,
} as const;

const clarifyJam = threads.rateLimit.id;
const envJam = threads.checkoutTest.id;
const mcpJam = threads.darkMode.id;
const errorJam = threads.bundler.id;
const reviewJam = threads.paginate.id;
const taskJam = threads.gettingStarted.id;
const interruptedJam = threads.incidents.id;

/** A pending clarify takeover: ask_user has no answer yet. */
const clarifyThread: EventRowEncoded[] = [
  prompt(clarifyJam, 1, "Add a rate limit to the todo app API."),
  turn(clarifyJam, 2, "toolu_state_clarify", "clarify_questions", {
    questions: [
      {
        question: "Which limit should the todo API use?",
        options: ["100 per minute", "1000 per hour"],
        multiSelect: false,
      },
    ],
  }),
  reply(clarifyJam, 3, "Waiting for the rate limit choice."),
];

/** An unfulfilled environment request with no matching variables notice. */
const environmentThread: EventRowEncoded[] = [
  prompt(envJam, 1, "Run the CLI tool end-to-end suite."),
  turn(envJam, 2, "toolu_state_env", "environment_request_variables", {
    variables: ["SAMPLE_E2E_TOKEN"],
    reason: "The CLI e2e suite needs a sample token.",
  }),
  reply(envJam, 3, "The suite can start once the token is available."),
];

/** A successful MCP add whose result carries the setup proposal. */
const mcpSetupThread: EventRowEncoded[] = [
  prompt(mcpJam, 1, "Connect the docs search server to the docs site."),
  turn(mcpJam, 2, "toolu_state_mcp", "mcp_add", {
    name: "Docs search",
    url: "https://mcp.example.com/docs",
  }),
  result(
    mcpJam,
    3,
    "toolu_state_mcp",
    {
      setup: {
        kind: "add",
        reason: "Search the docs from the docs thread.",
        project: "current",
        owner: "user",
        secrets: {},
        server: {
          serverKey: "docs-search",
          displayName: "Docs search",
          iconUrl: null,
          transport: {
            type: "http",
            url: "https://mcp.example.com/docs",
            requestHeaderNames: [],
            auth: {
              type: "oauth",
              credentialHeaderNames: [],
              clientId: null,
              clientSecretRequired: false,
            },
          },
        },
      },
    },
    "Docs search is ready to authenticate.",
  ),
  reply(mcpJam, 4, "Docs search needs your sign-in before it can be used."),
];

/** Both error severities: a retryable warning and a non-retryable error. */
const errorThread: EventRowEncoded[] = [
  prompt(errorJam, 1, "Upgrade the bundler for the todo app."),
  row(errorJam, 2, "error", {
    actor: system,
    origin: sys,
    code: "sample_provider_overloaded",
    message: "The sample model provider is busy; the retry is queued.",
    retryable: true,
  }),
  row(errorJam, 3, "error", {
    actor: system,
    origin: sys,
    code: "sample_build_failed",
    message: "The sample bundle step failed without a retry.",
    retryable: false,
  }),
  reply(errorJam, 4, "One issue is retrying and one needs a fix."),
];

/** A review completion notification with its PR and finding count. */
const reviewThread: EventRowEncoded[] = [
  prompt(reviewJam, 1, "Review the docs site pagination change."),
  row(reviewJam, 2, "notification", {
    actor: github,
    origin: {
      type: "github",
      deliveryId: "dlv_state_review",
      repoFullName: "acme/docs",
      prNumber: 57,
    },
    key: "review_completion",
    summary: "Review complete on acme/docs#57",
    reviewCompletion: { prNumber: 57, issues: 1 },
    ref: { kind: "pr", id: "57" },
  }),
  reply(reviewJam, 3, "The review finished with one finding."),
];

/** A finished subagent task report. */
const taskThread: EventRowEncoded[] = [
  prompt(taskJam, 1, "Draft the CLI tool getting started guide."),
  row(taskJam, 2, "task_completion", {
    actor: { type: "agent", jamId: "jam_sample_docs_child" },
    origin: {
      type: "agent",
      jamId: "jam_sample_docs_child",
      relation: { type: "parent" },
    },
    childJamId: "jam_sample_docs_child",
    localIndex: 1,
    outcome: "completed",
    summary: "Drafted the guide with a shorter quickstart.",
    deliveryState: "final",
    attachments: [{ file: file("quickstart.txt"), title: "Quickstart" }],
  }),
  reply(taskJam, 3, "The guide draft is in."),
];

/** A partial reply interrupted by the user before it could settle. */
const interruptedThread: EventRowEncoded[] = [
  prompt(interruptedJam, 1, "Summarize last week's sample incidents.", userSam),
  row(interruptedJam, 2, "assistant", {
    actor: { type: "agent", jamId: interruptedJam },
    origin: sys,
    model: {
      modelId: "anthropic/claude-sample",
      providerModelId: "claude-sample",
    },
    route: { source: "capy" },
    usage: {
      inputTokens: 980,
      outputTokens: 40,
      cacheReadTokens: 0,
      cacheWriteTokens: 0,
    },
    stopReason: "end_turn",
    blocks: [
      {
        id: "blk_state_interrupted",
        type: "interrupted_reply",
        text: "The sample incident summary was cut short.",
      },
    ],
  }),
];

/** A follow-up whose message carries mention chips and whose call returns json and a file. */
const mentionThread: EventRowEncoded[] = [
  row(taskJam, 4, "message", {
    actor: user,
    origin: web,
    text: "use kiki-ux-verify before you ship, and cite acme/docs#57",
    mentions: [
      {
        kind: "skill",
        id: "kiki-ux-verify",
        label: "kiki-ux-verify",
        start: 4,
        end: 18,
        text: "kiki-ux-verify",
      },
      {
        kind: "pr",
        id: "acme/docs#57",
        label: "acme/docs#57",
        start: 45,
        end: 58,
        text: "acme/docs#57",
      },
    ],
    files: [],
    delivery: "queue",
  }, "answered"),
  turn(taskJam, 5, "toolu_state_mention", "bash", { command: "ls guide" }),
  row(taskJam, 6, "tool_result", {
    actor: { type: "agent", jamId: taskJam },
    origin: sys,
    toolCallId: "toolu_state_mention",
    isError: false,
    blocks: [
      { type: "json", data: { files: 2, bytes: 1_204 } },
      { type: "file", file: file("quickstart.txt") },
    ],
    data: {},
  }),
];

export const threadStateSeeds: ReadonlyArray<EventRowEncoded> = [
  ...clarifyThread,
  ...environmentThread,
  ...mcpSetupThread,
  ...errorThread,
  ...reviewThread,
  ...taskThread,
  ...interruptedThread,
  ...mentionThread,
];

export const threadStateJamIds = [
  clarifyJam,
  envJam,
  mcpJam,
  errorJam,
  reviewJam,
  taskJam,
  interruptedJam,
] as const;
