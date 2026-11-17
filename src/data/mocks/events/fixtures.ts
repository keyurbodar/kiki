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

import { isoMinutesAgo, people, threads } from "../fixtures/world.ts";

export type EventState = "queued" | "streaming" | "committed" | "cancelled";

export interface StoredEvent {
  readonly id: string;
  readonly jamId: string;
  readonly kind: string;
  readonly state: EventState;
  readonly actorId: string;
  readonly createdAt: string;
  readonly text?: string;
  readonly command?: string;
  readonly summary?: string;
}

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

export const seedEvents: ReadonlyArray<StoredEvent> = [
  {
    id: "evt_sample_context",
    jamId: threads.checkoutTest.id,
    kind: "context",
    state: "committed",
    actorId: people.alex.id,
    createdAt: isoMinutesAgo(90),
    text: "Fix a flaky checkout test in acme/web.",
  },
  {
    id: "evt_sample_message",
    jamId: threads.checkoutTest.id,
    kind: "message",
    state: "committed",
    actorId: people.alex.id,
    createdAt: isoMinutesAgo(85),
    text: "The checkout test times out when the payment gateway is slow.",
  },
  {
    id: "evt_sample_assistant",
    jamId: threads.checkoutTest.id,
    kind: "assistant",
    state: "committed",
    actorId: people.sam.id,
    createdAt: isoMinutesAgo(80),
    text: "I'll add a bounded retry around the gateway call.",
  },
  {
    id: "evt_sample_tool",
    jamId: threads.checkoutTest.id,
    kind: "tool_result",
    state: "committed",
    actorId: people.sam.id,
    createdAt: isoMinutesAgo(75),
    text: "Updated src/checkout/retry.ts",
  },
  {
    id: "evt_sample_queued00000000000000001",
    jamId: threads.checkoutTest.id,
    kind: "message",
    state: "queued",
    actorId: people.priya.id,
    createdAt: isoMinutesAgo(3),
    text: "Also check the timeout on the staging environment.",
  },
  {
    id: "evt_sample_docs",
    jamId: threads.gettingStarted.id,
    kind: "message",
    state: "committed",
    actorId: people.priya.id,
    createdAt: isoMinutesAgo(24 * 60),
    text: "Draft the getting started guide for the API.",
  },
  {
    id: "evt_sample_command",
    jamId: threads.gettingStarted.id,
    kind: "control",
    state: "committed",
    actorId: people.sam.id,
    createdAt: isoMinutesAgo(20 * 60),
    command: "compact",
  },
];

export const outline: ReadonlyArray<EventOutlineSection> = [
  {
    id: "sec_sample_context",
    label: "Starting context",
    eventId: "evt_sample_context",
    children: [],
  },
  {
    id: "sec_sample_investigation",
    label: "Investigation",
    eventId: "evt_sample_message",
    children: ["evt_sample_tool"],
  },
  {
    id: "sec_sample_next",
    label: "Follow-up",
    eventId: "evt_sample_queued00000000000000001",
    children: [],
  },
];

export const messageVersions: Readonly<
  Record<string, ReadonlyArray<MessageVersionRow>>
> = {
  evt_sample_message: [
    {
      id: "evt_sample_message",
      text: "The checkout test times out when the payment gateway is slow.",
      createdAt: isoMinutesAgo(85),
      live: true,
    },
    {
      id: "evt_sample_message_v1",
      text: "The checkout test times out when the gateway is slow.",
      createdAt: isoMinutesAgo(84),
      live: false,
    },
  ],
  evt_sample_queued00000000000000001: [
    {
      id: "evt_sample_queued00000000000000001",
      text: "Also check the timeout on the staging environment.",
      createdAt: isoMinutesAgo(3),
      live: true,
    },
  ],
};
