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
import { captains, isoMinutesAgo, people, threads } from "../fixtures/world.ts";
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

/** A Captain is a thread: its jam id opens in the thread view, with a conversation of its own. */
const captainJam = (alias: string): string => {
  const found = captains.find((captain) => captain.alias === alias);
  if (found === undefined) throw new Error(`events: no captain ${alias}`);
  return found.id;
};
const releaseCaptainJam = captainJam("release");
const docsCaptainJam = captainJam("docs");
const platformCaptainJam = captainJam("platform");

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
const failCallId = "toolu_sample_fail";
const detachedCallId = "toolu_sample_detached";

const at = {
  prompt: isoMinutesAgo(90),
  followUp: isoMinutesAgo(85),
  turn: isoMinutesAgo(80),
  result: isoMinutesAgo(75),
  queued: isoMinutesAgo(3),
  docs: isoMinutesAgo(24 * 60),
  command: isoMinutesAgo(20 * 60),
  releaseAsk: isoMinutesAgo(58),
  releaseTurn: isoMinutesAgo(55),
  docsCaptainAsk: isoMinutesAgo(41),
  docsCaptainTurn: isoMinutesAgo(38),
  platformAsk: isoMinutesAgo(23),
  platformTurn: isoMinutesAgo(20),
  automation: isoMinutesAgo(1),
  toolFail: isoMinutesAgo(2),
  toolDetached: isoMinutesAgo(2),
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
 * transcript. `jam_01M7FP6GKY49R183VW3NBE3Y2Z` carries a twelve-turn
 * conversation — six user turns, six agent turns with sections and a clamp, tool
 * activity and an MCP proposal — because the thread routes are scored against it
 * and a one-turn fixture renders nothing for a component to be measured in. The
 * other two are short. Every word below is invented.
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
    [
      "Trace the flaky shard timeout from last night's release and tell me whether the retry budget hid it.",
      "",
      "A few things I already know, so you do not spend a turn on them:",
      "",
      "- it was shard three, and only ever shard three",
      "- the run before it passed on a warm runner",
      "- the deploy step never ran, because the release stopped at the test step",
      "- nobody touched the retry helper in that window",
      "",
      "What I want to know is whether the budget made the failure slower without making it rarer, and if the spec is waiting on a clock I want the number and the line it waits on. If the fix belongs in the stub rather than the spec, say so and leave the spec alone — I would rather fix the thing that is actually late.",
      "",
      "One more thing on the budget itself: I do not want it raised. Two attempts is the number we agreed on and a release that hangs for five minutes is worse than a rerun, so if the fix is the wait, keep the budget as it is and let the shard fail fast when the stub is late. If the fix turns out to be the stub, then the budget is doing real work and I want to know that too, because it would mean we have been retrying a wait that never had a chance of succeeding.",
      "",
      "Do not change the deploy step in this pass.",
    ].join("\n"),
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
  ...captureProbe.deliver(
    "toolu_capture_probe_say_log",
    [
      "## What the log says",
      "",
      "The failed shard ends in a **checkout timeout** after thirty seconds, and the wait is a fixed one in the spec rather than the gateway being slow. The retry budget did not hide the fault: both attempts spent the same thirty seconds on the same step, so the run failed twice in the same place.",
      "",
      "Three things follow from that:",
      "",
      "- the timeout is not a scheduling problem, because a warm shard fails at the same second",
      "- the retry doubled the wall clock without changing the outcome",
      "- the deploy step never ran, so nothing was published",
      "",
      "The spec waits on a clock where it should wait on the gateway stub to answer. I want the stub's own timing before I touch the spec, because if the stub is what is slow the fix belongs there instead.",
    ].join("\n"),
  ),
  captureProbe.message(
    "Does the budget cover a cold shard or only a warm one?",
    people.sam.id,
  ),
  ...captureProbe.deliver(
    "toolu_capture_probe_say_budget",
    [
      "Only a warm one today. The budget is a count, not a deadline:",
      "",
      "```sh",
      "attempts=0",
      'while [ "$attempts" -lt 2 ]; do',
      '  ./shard.sh "$SHARD" && break',
      "  attempts=$((attempts + 1))",
      "done",
      "```",
      "",
      "A cold shard spends its thirty seconds on the first attempt and has nothing left for the second, which is why the run showed a timeout instead of a retry that worked.",
    ].join("\n"),
  ),
  captureProbe.call("toolu_capture_probe_spec", "read", {
    path: "tests/checkout/checkout.spec.ts",
  }),
  captureProbe.result(
    "toolu_capture_probe_spec",
    "Read tests/checkout/checkout.spec.ts.",
    { path: "tests/checkout/checkout.spec.ts", lines: 120 },
  ),
  ...captureProbe.deliver(
    "toolu_capture_probe_say_spec",
    [
      "## The wait is the fault",
      "",
      "Two waits in the checkout spec are hard-coded at thirty seconds and both cover the same gateway stub. The stub answers in about two seconds on a warm runner and just over thirty on a cold one, so the fixed wait is fine until the machine is cold and then it is exactly one second short.",
      "",
      "## What I would change",
      "",
      "Wait for the stub's ready signal instead of the clock. That fails fast when the stub never comes up and passes immediately when it does, and the gateway keeps its own timeout so nothing can hang forever.",
      "",
      "## What stays",
      "",
      "The retry budget stays at two attempts. It is the right shape for a genuinely flaky step; it is just not a substitute for waiting on the right thing.",
    ].join("\n"),
  ),
  captureProbe.message(
    "Link the failed run in the thread so I can read it later.",
  ),
  captureProbe.call("toolu_capture_probe_mcp", "mcp_add", {
    name: "Release runs",
    url: "https://mcp.example.com/release-runs",
  }),
  captureProbe.result(
    "toolu_capture_probe_mcp",
    "Release runs is ready to authenticate.",
    {
      setup: {
        kind: "add",
        reason: "Quote the failing run's link in the thread.",
        project: "current",
        owner: "user",
        secrets: {},
        server: {
          serverKey: "release-runs",
          displayName: "Release runs",
          iconUrl: null,
          transport: {
            type: "http",
            url: "https://mcp.example.com/release-runs",
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
  ),
  ...captureProbe.deliver(
    "toolu_capture_probe_say_mcp",
    "Release runs is proposed and needs your sign-in before I can quote a run link from it. The log I read is last night's failed release, shard three.",
  ),
  captureProbe.message(
    "Cap it at two attempts and stop there. A release that hangs for five minutes is worse than a rerun.",
    people.sam.id,
  ),
  captureProbe.call(
    "toolu_capture_probe_test",
    "bash",
    {
      command: "bun run test:checkout --shard 1",
      description: "Run the checkout spec against the new wait",
    },
    "The budget stays at two. The plan is to replace the fixed wait with the stub's ready signal, re-run the checkout spec on a cold shard, and leave the deploy step untouched.",
  ),
  captureProbe.result(
    "toolu_capture_probe_test",
    "The checkout spec passes on a cold shard in 41s.",
    { shard: 1, passed: 12, failed: 0, durationMs: 41_200 },
  ),
  captureProbe.message("Good, send the pull request when it is up."),
  ...captureProbe.deliver(
    "toolu_capture_probe_say_pr",
    [
      "The pull request is up and the shard that failed last night is green on it.",
      "",
      "It replaces the fixed wait with the stub's ready signal in the two places the spec used a clock, and it changes nothing else: the retry budget, the runner and the deploy step are as they were.",
    ].join("\n"),
  ),
  captureProbe.message(
    "Does this touch the deploy step at all?",
    people.priya.id,
  ),
  ...captureProbe.deliver(
    "toolu_capture_probe_say_deploy",
    [
      "No. The wait is in the checkout spec, which runs before the deploy step reads its result, so a green shard publishes exactly as it did before and a red one still stops the release.",
      "",
      "The only behaviour that changes is *how long* a cold shard waits before it decides the stub is late: two seconds instead of thirty when the stub is down, and the stub's own answer when it is up. If you want the deploy step to see the retry count in its summary I can add that, but I would keep it out of this change.",
    ].join("\n"),
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
  row(
    releaseCaptainJam,
    at.releaseAsk,
    8,
    "message",
    {
      actor: user(people.alex.id),
      origin: web(people.alex.id),
      text: "Cut the weekly web release and tell me what still needs a fix.",
      files: [],
      delivery: "queue",
    },
    "answered",
  ),
  row(releaseCaptainJam, at.releaseTurn, 9, "assistant", {
    actor: agent(releaseCaptainJam),
    origin: sys,
    model: sampleModel,
    route: { source: "capy" },
    usage: sampleUsage,
    stopReason: "end_turn",
    blocks: [
      {
        id: "blk_sample_release_captain",
        type: "text",
        text: "The release branch is cut and its checks are running.",
      },
    ],
  }),
  row(
    docsCaptainJam,
    at.docsCaptainAsk,
    10,
    "message",
    {
      actor: user(people.priya.id),
      origin: web(people.priya.id),
      text: "Regenerate the API reference for the retry endpoint.",
      files: [],
      delivery: "queue",
    },
    "answered",
  ),
  row(docsCaptainJam, at.docsCaptainTurn, 11, "assistant", {
    actor: agent(docsCaptainJam),
    origin: sys,
    model: sampleModel,
    route: { source: "capy" },
    usage: sampleUsage,
    stopReason: "end_turn",
    blocks: [
      {
        id: "blk_sample_docs_captain",
        type: "text",
        text: "The API reference is regenerated and published.",
      },
    ],
  }),
  row(
    platformCaptainJam,
    at.platformAsk,
    12,
    "message",
    {
      actor: user(people.sam.id),
      origin: web(people.sam.id),
      text: "Someone is asking which branch the checkout retry fix went to.",
      files: [],
      delivery: "queue",
    },
    "answered",
  ),
  row(platformCaptainJam, at.platformTurn, 13, "assistant", {
    actor: agent(platformCaptainJam),
    origin: sys,
    model: sampleModel,
    route: { source: "capy" },
    usage: sampleUsage,
    stopReason: "end_turn",
    blocks: [
      {
        id: "blk_sample_platform_captain",
        type: "text",
        text: "It went to `release/2026-11-17` in acme/web. The checks are green and the merge queue has it.",
      },
    ],
  }),
  ...captureHistory,
  row(checkoutJam, at.toolFail, 32, "assistant", {
    actor: agent(checkoutJam),
    origin: sys,
    model: sampleModel,
    route: { source: "capy" },
    usage: sampleUsage,
    stopReason: "tool_use",
    blocks: [
      {
        id: "blk_sample_fail_call",
        type: "tool_use",
        toolCallId: failCallId,
        toolName: "bash",
        args: {
          command: "bun run test:checkout",
          description: "Running the checkout suite",
        },
      },
    ],
  }),
  row(checkoutJam, at.toolFail, 33, "tool_result", {
    actor: agent(checkoutJam),
    origin: sys,
    toolCallId: failCallId,
    isError: true,
    blocks: [
      { type: "text", text: "2 tests failed in src/checkout/retry.test.ts" },
    ],
    data: { exit_code: 2, duration_ms: 4_800, timed_out: false },
  }),
  row(checkoutJam, at.toolDetached, 34, "assistant", {
    actor: agent(checkoutJam),
    origin: sys,
    model: sampleModel,
    route: { source: "capy" },
    usage: sampleUsage,
    stopReason: "tool_use",
    blocks: [
      {
        id: "blk_sample_detached_call",
        type: "tool_use",
        toolCallId: detachedCallId,
        toolName: "bash",
        args: {
          command: "bun run dev",
          description: "Serving the app",
          execution: "detached",
        },
      },
    ],
  }),
  row(checkoutJam, at.toolDetached, 35, "tool_result", {
    actor: agent(checkoutJam),
    origin: sys,
    toolCallId: detachedCallId,
    isError: false,
    blocks: [{ type: "text", text: "vite v8.3.8 ready in 412 ms" }],
    data: { operation_id: "op_sample_dev", execution: "detached" },
  }),
  row(
    checkoutJam,
    at.automation,
    31,
    "message",
    {
      actor: user(people.alex.id),
      origin: { type: "automation", automationId: "auto_sample_deps" },
      text: [
        "Nightly run finished. Three dependencies moved: hono 4.9.2, vitest 5.1.0 and effect 4.0.3.",
        "",
        "- acme/web: all tests pass on `main`, nothing to do.",
        "- acme/api: one snapshot changed with the hono bump and needs a reviewer.",
        "- acme/docs: the vitest bump fails two component tests in the explorer.",
        "",
        "I opened a follow-up thread for the explorer failures and left the snapshot change for whoever owns acme/api this week. No credentials were touched and every branch this run created was pushed before the machine slept.",
      ].join("\n"),
      files: [],
      delivery: "queue",
    },
    "answered",
  ),
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
