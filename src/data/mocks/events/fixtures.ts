/** Context usage per thread for `GET events/context-usage`. Neutral sample numbers. */
export const sampleContextUsage: Readonly<
  Record<
    string,
    {
      readonly usedTokens: number;
      readonly budgetTokens: number;
      readonly bound: "context" | "input";
      readonly segments?: ReadonlyArray<{
        readonly key:
          | "system"
          | "tools"
          | "rules"
          | "skills"
          | "mcp"
          | "environment"
          | "conversation";
        readonly tokens: number;
      }>;
      readonly modelId?: string;
      readonly compactAtTokens?: number;
      readonly defaultCompactAtTokens?: number;
      readonly windowTokens?: number;
      readonly threadCompactAtTokens?: number;
    }
  >
> = {
  [threads.checkoutTest.id]: {
    usedTokens: 48_200,
    budgetTokens: 200_000,
    bound: "context",
    segments: [
      { key: "system", tokens: 6_100 },
      { key: "tools", tokens: 9_400 },
      { key: "rules", tokens: 1_200 },
      { key: "skills", tokens: 2_300 },
      { key: "mcp", tokens: 3_800 },
      { key: "environment", tokens: 1_900 },
      { key: "conversation", tokens: 23_500 },
    ],
    modelId: "sample-model",
    compactAtTokens: 160_000,
    defaultCompactAtTokens: 160_000,
    windowTokens: 200_000,
  },
  [threads.darkMode.id]: {
    usedTokens: 184_000,
    budgetTokens: 200_000,
    bound: "context",
  },
  [threads.paginate.id]: {
    usedTokens: 200_000,
    budgetTokens: 200_000,
    bound: "input",
  },
  [threads.capturePipeline.id]: {
    usedTokens: 96_400,
    budgetTokens: 200_000,
    bound: "context",
    modelId: "anthropic/claude-sample",
    compactAtTokens: 160_000,
    windowTokens: 200_000,
  },
  [threads.captureFiles.id]: {
    usedTokens: 41_200,
    budgetTokens: 200_000,
    bound: "context",
    modelId: "anthropic/claude-sample",
    compactAtTokens: 160_000,
    windowTokens: 200_000,
  },
  [threads.captureSideParent.id]: {
    usedTokens: 28_600,
    budgetTokens: 200_000,
    bound: "context",
    modelId: "anthropic/claude-sample",
    compactAtTokens: 160_000,
    windowTokens: 200_000,
  },
  [threads.captureProbe.id]: {
    usedTokens: 12_300,
    budgetTokens: 200_000,
    bound: "context",
    modelId: "anthropic/claude-sample",
    compactAtTokens: 160_000,
    windowTokens: 200_000,
  },
};

export const emptyContextUsage = {
  usedTokens: 0,
  budgetTokens: 200_000,
  bound: "context",
} as const;

import type { EventRowEncoded } from "@/data/events";
import { isoMinutesAgo, people, threads } from "../fixtures/world.ts";
import { eventId } from "./event-ids.ts";

export interface EventOutlineSection {
  readonly id: string;
  readonly label: string;
  readonly eventId: string;
  readonly children: ReadonlyArray<string>;
}

export interface MessageVersionRow {
  readonly id: string;
  readonly text: string;
  readonly createdAt: string;
  readonly live: boolean;
}

const checkoutJam = threads.checkoutTest.id;
const docsJam = threads.gettingStarted.id;

const user = (userId: string) => ({ type: "user" as const, userId });
const agent = (jamId: string) => ({ type: "agent" as const, jamId });
const web = (userId: string) => ({ type: "web" as const, userId });
const systemActor = { type: "system" as const, service: "system" as const };
const sys = { type: "system" as const };

const sampleModel = {
  modelId: "anthropic/claude-sample",
  providerModelId: "claude-sample",
};

const sampleUsage = {
  inputTokens: 1_200,
  outputTokens: 240,
  cacheReadTokens: 0,
  cacheWriteTokens: 0,
};

const retryCallId = "toolu_sample_retry";

const at = {
  prompt: isoMinutesAgo(90),
  followUp: isoMinutesAgo(85),
  turn: isoMinutesAgo(80),
  result: isoMinutesAgo(75),
  queued: isoMinutesAgo(3),
  docs: isoMinutesAgo(24 * 60),
  command: isoMinutesAgo(20 * 60),
};

/** The ids the outline and the message versions below point at. */
const ids = {
  prompt: eventId(at.prompt, 1),
  followUp: eventId(at.followUp, 2),
  edit: eventId(at.followUp, 21),
  turn: eventId(at.turn, 3),
  result: eventId(at.result, 4),
  queued: eventId(at.queued, 5),
  docs: eventId(at.docs, 6),
  command: eventId(at.command, 7),
};

/** One seeded row, in the encoded shape `GET events` serves and the client decodes. */
const row = (
  jamId: string,
  createdAt: string,
  sequence: number,
  kind: EventRowEncoded["kind"],
  payload: object,
  state: EventRowEncoded["state"] = "committed",
): EventRowEncoded =>
  ({
    id: eventId(createdAt, sequence),
    jamId,
    kind,
    state,
    createdAt,
    payload,
  }) as EventRowEncoded;

/**
 * The history the parity captures read. `jam_01M7FSZ5JHHYSDA2WM61W88WEG` is the
 * long one: markdown, a fenced block, tool calls (one still running), a retryable
 * error, a failed call and task reports, so the thread route draws a real
 * transcript. The other three are short. Every word below is invented.
 */
const capturePipelineJam = threads.capturePipeline.id;
const captureFilesJam = threads.captureFiles.id;
const captureSideJam = threads.captureSideParent.id;
const captureProbeJam = threads.captureProbe.id;

/** Child jams the capture threads report on; their cards live in children/fixtures.ts. */
const captureChildRetry = "jam_capture_child_retry";
const captureChildShard = "jam_capture_child_shard";

let captureSequence = 100;

type CaptureStep = (
  kind: EventRowEncoded["kind"],
  payload: object,
  state?: EventRowEncoded["state"],
) => EventRowEncoded;

/** Rows of one capture thread, `stepMinutes` apart and oldest first. */
const captureTimeline = (
  jamId: string,
  startsMinutesAgo: number,
  stepMinutes = 2,
): CaptureStep => {
  let index = 0;
  return (kind, payload, state = "committed") => {
    index += 1;
    captureSequence += 1;
    return row(
      jamId,
      isoMinutesAgo(startsMinutesAgo - index * stepMinutes),
      captureSequence,
      kind,
      payload,
      state,
    );
  };
};

const captureVoice = (jamId: string, said: CaptureStep) => {
  const blockId = (suffix: string) =>
    `blk_capture_${captureSequence + 1}_${suffix}`;
  const turn = (blocks: object[], stopReason: "tool_use" | "end_turn") =>
    said("assistant", {
      actor: agent(jamId),
      origin: sys,
      model: sampleModel,
      route: { source: "capy" },
      usage: sampleUsage,
      stopReason,
      blocks,
    });
  return {
    message: (
      text: string,
      userId: string = people.alex.id,
      state: "answered" | "pending" = "answered",
    ) =>
      said(
        "message",
        {
          actor: user(userId),
          origin: web(userId),
          text,
          files: [],
          delivery: "queue",
        },
        state,
      ),
    reply: (text: string) =>
      turn([{ id: blockId("text"), type: "text", text }], "end_turn"),
    /** A reply the agent hands the person, so the timeline draws an agent bubble. */
    deliver: (toolCallId: string, text: string) => [
      turn(
        [
          {
            id: blockId("call"),
            type: "tool_use",
            toolCallId,
            toolName: "message_user",
            args: { text, files: [] },
          },
        ],
        "tool_use",
      ),
      said("tool_result", {
        actor: agent(jamId),
        origin: sys,
        toolCallId,
        isError: false,
        blocks: [{ type: "text", text: "Delivered." }],
        data: { delivered: [] },
      }),
    ],
    call: (toolCallId: string, toolName: string, args: object, text?: string) =>
      turn(
        [
          ...(text === undefined
            ? []
            : [{ id: blockId("say"), type: "text", text }]),
          { id: blockId("call"), type: "tool_use", toolCallId, toolName, args },
        ],
        "tool_use",
      ),
    result: (toolCallId: string, text: string, data: object, isError = false) =>
      said("tool_result", {
        actor: agent(jamId),
        origin: sys,
        toolCallId,
        isError,
        blocks: [{ type: "text", text }],
        data,
      }),
    failure: (code: string, message: string, retryable = true) =>
      said("error", {
        actor: systemActor,
        origin: sys,
        code,
        message,
        retryable,
      }),
    task: (
      childJamId: string,
      localIndex: number,
      summary: string,
      outcome: "completed" | "failed" | "stopped" = "completed",
    ) =>
      said("task_completion", {
        actor: { type: "agent", jamId: childJamId },
        origin: {
          type: "agent",
          jamId: childJamId,
          relation: { type: "parent" },
        },
        childJamId,
        localIndex,
        outcome,
        summary,
        deliveryState: "final",
        attachments: [],
      }),
  };
};

const capturePipeline = captureVoice(
  capturePipelineJam,
  captureTimeline(capturePipelineJam, 132),
);
const captureFiles = captureVoice(
  captureFilesJam,
  captureTimeline(captureFilesJam, 52),
);
const captureSide = captureVoice(
  captureSideJam,
  captureTimeline(captureSideJam, 96),
);
const captureProbe = captureVoice(
  captureProbeJam,
  captureTimeline(captureProbeJam, 300, 3),
);

const captureHistory: ReadonlyArray<EventRowEncoded> = [
  capturePipeline.message(
    "Give the release pipeline a retry budget so one flaky shard cannot fail a release.",
  ),
  ...capturePipeline.deliver(
    "toolu_capture_say_plan",
    [
      "## Release pipeline retry",
      "",
      "The shard runner stops on the first failure, so a **single flaky test** fails the release. I will cap the retry at `2` attempts and leave the deploy step alone.",
      "",
      "- read the runner and its retry helper",
      "- add the budget to the shard loop",
      "- re-run shard 3 on a cold machine",
    ].join("\n"),
  ),
  capturePipeline.call("toolu_capture_runner", "read", {
    path: "scripts/release/shard.sh",
  }),
  capturePipeline.result(
    "toolu_capture_runner",
    "Read scripts/release/shard.sh.",
    { path: "scripts/release/shard.sh", lines: 84 },
  ),
  capturePipeline.call("toolu_capture_helper", "read", {
    path: "scripts/release/lib/retry.sh",
  }),
  capturePipeline.result(
    "toolu_capture_helper",
    "Read scripts/release/lib/retry.sh.",
    { path: "scripts/release/lib/retry.sh", lines: 26 },
  ),
  capturePipeline.call(
    "toolu_capture_grep",
    "bash",
    {
      command: 'grep -n "exit" scripts/release/shard.sh',
      description: "Find where the runner exits",
    },
    "The helper loops until the shard passes, so one flaky shard keeps it running.",
  ),
  capturePipeline.result(
    "toolu_capture_grep",
    "Found three exit paths in the runner.",
    { matches: 3 },
  ),
  capturePipeline.reply(
    [
      "The retry the runner imports has no ceiling:",
      "",
      "```sh",
      'until ./shard.sh "$SHARD"; do',
      "  attempts=$((attempts + 1))",
      "done",
      "```",
      "",
      "I am replacing that loop with a bounded one and printing the budget it spent.",
    ].join("\n"),
  ),
  capturePipeline.call("toolu_capture_write", "write", {
    path: "scripts/release/lib/retry.sh",
    description: "Add the retry budget",
  }),
  capturePipeline.result(
    "toolu_capture_write",
    "Updated scripts/release/lib/retry.sh.",
    { path: "scripts/release/lib/retry.sh", changed: 18 },
  ),
  capturePipeline.call("toolu_capture_shard3", "bash", {
    command: "bun run test:release --shard 3",
    description: "Run the release test shards",
  }),
  capturePipeline.result(
    "toolu_capture_shard3",
    "shard 3 failed: tests/checkout/checkout.spec.ts timed out after 30s",
    { shard: 3, failed: 1, durationMs: 32_400 },
    true,
  ),
  capturePipeline.failure(
    "sample_shard_timeout",
    "Shard 3 timed out on both attempts; the pipeline stopped at the test step.",
  ),
  capturePipeline.reply(
    "Both attempts timed out on the same test, so the retry is not what is flaky. Reading the spec to see what it waits on.",
  ),
  capturePipeline.call("toolu_capture_spec", "read", {
    path: "tests/checkout/checkout.spec.ts",
  }),
  capturePipeline.result(
    "toolu_capture_spec",
    "Read tests/checkout/checkout.spec.ts.",
    { path: "tests/checkout/checkout.spec.ts", lines: 120 },
  ),
  capturePipeline.call(
    "toolu_capture_waits",
    "bash",
    {
      command: 'grep -rn "30_000" tests/checkout',
      description: "Find the hard-coded wait",
    },
    "The spec waits a fixed thirty seconds for the gateway stub.",
  ),
  capturePipeline.result(
    "toolu_capture_waits",
    "Two matches, both in the checkout spec.",
    { matches: 2 },
  ),
  capturePipeline.message(
    "Cap it at two attempts. A release that hangs for five minutes is worse than a rerun.",
    people.sam.id,
  ),
  capturePipeline.reply(
    [
      "Agreed, the budget stays at `2`.",
      "",
      "The wait is the actual fault:",
      "",
      "- the spec waits a fixed 30s",
      "- the gateway stub answers in 32s on a cold shard",
      "- the retry doubled the wait instead of hiding it",
    ].join("\n"),
  ),
  capturePipeline.call("toolu_capture_edit_spec", "edit", {
    path: "tests/checkout/checkout.spec.ts",
    description: "Wait for the gateway stub instead of the clock",
  }),
  capturePipeline.result(
    "toolu_capture_edit_spec",
    "Updated tests/checkout/checkout.spec.ts.",
    { path: "tests/checkout/checkout.spec.ts", changed: 9 },
  ),
  capturePipeline.call("toolu_capture_shard3_again", "bash", {
    command: "bun run test:release --shard 3",
    description: "Run shard 3 again",
  }),
  capturePipeline.result(
    "toolu_capture_shard3_again",
    "shard 3 passed: 41 tests, 1 retry spent.",
    { shard: 3, failed: 0, durationMs: 19_800 },
  ),
  capturePipeline.reply(
    "Shard 3 is green with one retry spent. Running the whole suite to see whether the budget holds across shards.",
  ),
  capturePipeline.message(
    "Staging ran it twice and both passed, so the flake is cold-start only.",
    people.sam.id,
  ),
  capturePipeline.reply(
    "That matches what I saw: the cold shard pays for the gateway stub. Two things left, the retry log line and the PR.",
  ),
  capturePipeline.call("toolu_capture_suite", "bash", {
    command: "bun run test:release",
    description: "Run every release shard",
  }),
  capturePipeline.result(
    "toolu_capture_suite",
    "All 6 shards passed: 246 tests, 2 retries spent.",
    { shards: 6, failed: 0, retries: 2 },
  ),
  capturePipeline.call("toolu_capture_status", "bash", {
    command: "git status --short",
    description: "Check the working tree",
  }),
  capturePipeline.result(
    "toolu_capture_status",
    "Three files changed on fix/shard-retry.",
    { files: 3, branch: "fix/shard-retry" },
  ),
  ...capturePipeline.deliver(
    "toolu_capture_say_summary",
    [
      "## Shard retry budget",
      "",
      "Three files changed and the suite is green:",
      "",
      "- `scripts/release/lib/retry.sh` stops after two attempts",
      "- `tests/checkout/checkout.spec.ts` waits for the stub",
      "- `src/ci/pipeline.ts` prints the budget it spent",
      "",
      "**Cost:** about two extra minutes on a cold shard, nothing on a warm one.",
    ].join("\n"),
  ),
  capturePipeline.task(
    captureChildRetry,
    1,
    "Added the retry budget to the shard loop and checked it against shard 3.",
  ),
  capturePipeline.message(
    "Open the PR and put the retry cost in the description.",
  ),
  capturePipeline.call("toolu_capture_push", "bash", {
    command: "git push -u origin fix/shard-retry",
    description: "Push the branch",
  }),
  capturePipeline.result("toolu_capture_push", "Pushed fix/shard-retry.", {
    branch: "fix/shard-retry",
    commits: 2,
  }),
  capturePipeline.call("toolu_capture_pr", "bash", {
    command: "gh pr create --fill",
    description: "Open the pull request",
  }),
  capturePipeline.result("toolu_capture_pr", "Opened acme/web#312.", {
    number: 312,
  }),
  capturePipeline.call("toolu_capture_checks", "bash", {
    command: "gh pr checks 312",
    description: "Read the PR checks",
  }),
  capturePipeline.result(
    "toolu_capture_checks",
    "no checks reported on the branch",
    { number: 312, checks: 0 },
    true,
  ),
  capturePipeline.reply(
    "The checks have not registered yet; the queue picks the PR up within a minute. Meanwhile I am reading where the pipeline prints the budget.",
  ),
  capturePipeline.call("toolu_capture_pipeline", "read", {
    path: "src/ci/pipeline.ts",
  }),
  capturePipeline.result("toolu_capture_pipeline", "Read src/ci/pipeline.ts.", {
    path: "src/ci/pipeline.ts",
    lines: 64,
  }),
  capturePipeline.call("toolu_capture_budget", "read", {
    path: "src/ci/budget.ts",
  }),
  capturePipeline.result("toolu_capture_budget", "Read src/ci/budget.ts.", {
    path: "src/ci/budget.ts",
    lines: 38,
  }),
  capturePipeline.call(
    "toolu_capture_usage",
    "bash",
    {
      command: 'grep -rn "retryBudget" src/ci',
      description: "Find the retry budget reads",
    },
    "The pipeline never reads the budget it spends, so the log says nothing about retries.",
  ),
  capturePipeline.result(
    "toolu_capture_usage",
    "One read, in the pipeline entry point.",
    { matches: 1 },
  ),
  capturePipeline.call("toolu_capture_edit_pipeline", "edit", {
    path: "src/ci/pipeline.ts",
    description: "Print the retry budget",
  }),
  capturePipeline.result(
    "toolu_capture_edit_pipeline",
    "Updated src/ci/pipeline.ts.",
    { path: "src/ci/pipeline.ts", changed: 7 },
  ),
  ...capturePipeline.deliver(
    "toolu_capture_say_code",
    [
      "The pipeline now logs the budget each shard spends:",
      "",
      "```ts",
      'console.log("shard " + shard + ": " + spent + " of " + budget + " retries");',
      "```",
    ].join("\n"),
  ),
  capturePipeline.task(
    captureChildShard,
    2,
    "Printed the retry budget per shard and re-ran the release suite.",
  ),
  capturePipeline.message(
    "Watch the release run and tell me if a shard needs another retry.",
  ),
  ...capturePipeline.deliver(
    "toolu_capture_say_watch",
    [
      "## Watching the release",
      "",
      "Six shards, two retries to spend between them:",
      "",
      "- shard 1 to 3 are warm and should not retry",
      "- shard 4 and 5 are the slow ones",
      "- shard 6 runs the smoke tests last",
      "",
      "I will report the first shard that spends a retry, and the release stays paused until it does.",
    ].join("\n"),
  ),
  capturePipeline.call("toolu_capture_watch", "bash", {
    command: "bun run release:watch --shards 1-6",
    description: "Watch the release run",
  }),

  captureFiles.message(
    "Split the release suite into six shards so each one finishes inside four minutes.",
  ),
  captureFiles.reply(
    [
      "## Six shards",
      "",
      "The suite is one 24-minute job. Six shards of about 40 tests each should land under four minutes:",
      "",
      "- shard 1: accounts and auth",
      "- shard 2: catalog",
      "- shard 3: checkout",
      "- shards 4 to 6: the rest",
    ].join("\n"),
  ),
  captureFiles.call("toolu_capture_split_read", "read", {
    path: "scripts/release/shards.ts",
  }),
  captureFiles.result(
    "toolu_capture_split_read",
    "Read scripts/release/shards.ts.",
    { path: "scripts/release/shards.ts", lines: 52 },
  ),
  captureFiles.call("toolu_capture_split_write", "write", {
    path: "scripts/release/shards.ts",
    description: "Split the suite into six shards",
  }),
  captureFiles.result(
    "toolu_capture_split_write",
    "Updated scripts/release/shards.ts.",
    { path: "scripts/release/shards.ts", changed: 31 },
  ),
  captureFiles.call("toolu_capture_split_one", "bash", {
    command: "bun run test:release --shard 1",
    description: "Run the first shard",
  }),
  captureFiles.result("toolu_capture_split_one", "shard 1 passed: 42 tests.", {
    shard: 1,
    failed: 0,
  }),
  captureFiles.reply(
    "Shard 1 finishes in 3m12s. Running the remaining shards before I call the split done.",
  ),
  captureFiles.call("toolu_capture_split_all", "bash", {
    command: "bun run test:release",
    description: "Run every release shard",
  }),
  captureFiles.result(
    "toolu_capture_split_all",
    "All 6 shards passed in 3m58s at the slowest.",
    { shards: 6, slowestMs: 238_000 },
  ),
  captureFiles.reply(
    "Every shard is under four minutes and the suite still passes, so the split holds. The diff is in the branch for review.",
  ),

  captureSide.message("Plan the pipeline hardening work for this quarter."),
  captureSide.reply(
    [
      "## Hardening plan",
      "",
      "Three pieces, in this order:",
      "",
      "1. **Shard isolation** so one slow test cannot hold the release",
      "2. **A retry budget** with a ceiling the log reports",
      "3. **A release watcher** that pages a person when a shard spends its budget",
    ].join("\n"),
  ),
  captureSide.call("toolu_capture_plan_read", "read", {
    path: "docs/pipeline.md",
  }),
  captureSide.result("toolu_capture_plan_read", "Read docs/pipeline.md.", {
    path: "docs/pipeline.md",
    lines: 96,
  }),
  captureSide.message(
    "Split it: shard isolation first, then the retry budget. The watcher can wait a week.",
    people.sam.id,
  ),
  captureSide.call("toolu_capture_plan_write", "write", {
    path: "docs/pipeline-plan.md",
    description: "Write the hardening plan",
  }),
  captureSide.result(
    "toolu_capture_plan_write",
    "Wrote docs/pipeline-plan.md.",
    { path: "docs/pipeline-plan.md", changed: 44 },
  ),
  captureSide.reply(
    "The plan is in `docs/pipeline-plan.md`, with shard isolation as the first cut and the retry budget beside it.",
  ),

  captureProbe.message(
    "Trace the flaky shard timeout from last night's release.",
  ),
  captureProbe.call("toolu_capture_probe_log", "bash", {
    command: "gh run view --log-failed",
    description: "Read the failed release log",
  }),
  captureProbe.result(
    "toolu_capture_probe_log",
    "The log ends in a checkout timeout, not a crash.",
    { shard: 3, timedOut: true },
  ),
  captureProbe.reply(
    "The failed shard timed out in the checkout spec after 30s, which matches the flake the retry thread is chasing.",
  ),
];

export const seedEvents: ReadonlyArray<EventRowEncoded> = [
  row(
    checkoutJam,
    at.prompt,
    1,
    "message",
    {
      actor: user(people.alex.id),
      origin: web(people.alex.id),
      text: "Fix a flaky checkout test in acme/web.",
      files: [],
      delivery: "queue",
    },
    "answered",
  ),
  row(
    checkoutJam,
    at.followUp,
    2,
    "message",
    {
      actor: user(people.alex.id),
      origin: web(people.alex.id),
      text: "The checkout test times out when the payment gateway is slow.",
      files: [],
      delivery: "queue",
    },
    "answered",
  ),
  row(checkoutJam, at.turn, 3, "assistant", {
    actor: agent(checkoutJam),
    origin: sys,
    model: sampleModel,
    route: { source: "capy" },
    usage: sampleUsage,
    stopReason: "tool_use",
    blocks: [
      {
        id: "blk_sample_retry_text",
        type: "text",
        text: "I'll add a bounded retry around the gateway call.",
      },
      {
        id: "blk_sample_retry_call",
        type: "tool_use",
        toolCallId: retryCallId,
        toolName: "write",
        args: { path: "src/checkout/retry.ts" },
      },
    ],
  }),
  row(checkoutJam, at.result, 4, "tool_result", {
    actor: agent(checkoutJam),
    origin: sys,
    assistantEventId: ids.turn,
    toolCallId: retryCallId,
    isError: false,
    blocks: [{ type: "text", text: "Updated src/checkout/retry.ts" }],
    data: { path: "src/checkout/retry.ts", changed: 12 },
  }),
  row(
    checkoutJam,
    at.queued,
    5,
    "message",
    {
      actor: user(people.priya.id),
      origin: web(people.priya.id),
      text: "Also check the timeout on the staging environment.",
      files: [],
      delivery: "queue",
    },
    "pending",
  ),
  row(
    docsJam,
    at.docs,
    6,
    "message",
    {
      actor: user(people.priya.id),
      origin: web(people.priya.id),
      text: "Draft the getting started guide for the API.",
      files: [],
      delivery: "queue",
    },
    "answered",
  ),
  row(docsJam, at.command, 7, "control", {
    actor: systemActor,
    origin: sys,
    command: { type: "compact" },
  }),
  ...captureHistory,
];

export const outline: ReadonlyArray<EventOutlineSection> = [
  {
    id: "sec_sample_context",
    label: "Starting context",
    eventId: ids.prompt,
    children: [],
  },
  {
    id: "sec_sample_investigation",
    label: "Investigation",
    eventId: ids.followUp,
    children: [ids.result],
  },
  {
    id: "sec_sample_next",
    label: "Follow-up",
    eventId: ids.queued,
    children: [],
  },
];

export const messageVersions: Readonly<
  Record<string, ReadonlyArray<MessageVersionRow>>
> = {
  [ids.followUp]: [
    {
      id: ids.followUp,
      text: "The checkout test times out when the payment gateway is slow.",
      createdAt: at.followUp,
      live: true,
    },
    {
      id: ids.edit,
      text: "The checkout test times out when the gateway is slow.",
      createdAt: isoMinutesAgo(84),
      live: false,
    },
  ],
  [ids.queued]: [
    {
      id: ids.queued,
      text: "Also check the timeout on the staging environment.",
      createdAt: at.queued,
      live: true,
    },
  ],
};
