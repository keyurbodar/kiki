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
