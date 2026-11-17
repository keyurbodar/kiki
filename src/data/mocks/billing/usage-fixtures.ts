import type {
  UsageBreakdownRoute,
  UsageMemberRow,
  UsageSeries,
  UsageSummary,
  UsageThreadPage,
} from "../../../features/settings-org/org-usage-page/types.ts";

const credits = (dollars: number) => Math.round(dollars * 100_000);
const tokens = (value: number) => ({
  inputTokens: Math.round(value * 0.8),
  outputTokens: Math.round(value * 0.2),
  cacheReadTokens: Math.round(value * 0.15),
});

const bucketPattern = [
  0, 0, 29, 55, 111, 108, 62, 67, 55, 51, 44, 34, 27, 42, 51, 98, 51, 45, 58,
  66, 74, 57, 94, 210, 88,
];

const seriesStart = Date.UTC(2026, 10, 16, 16);
const hour = 3_600_000;

export const usageSummaryFixture: UsageSummary = {
  period: {
    start: new Date(Date.UTC(2026, 10, 15)).toISOString(),
    end: new Date(Date.UTC(2026, 10, 22)).toISOString(),
  },
  balance: { remainingCredits: credits(-0.3), unlimited: false },
  included: [],
};

export const usageSeriesFixture: UsageSeries = {
  bucket: "hour",
  keys: [
    { key: "paid", label: "Billed" },
    { key: "byok", label: "BYOK" },
    { key: "subscription", label: "Subscription" },
  ],
  buckets: bucketPattern.map((value, index) => {
    const start = new Date(seriesStart + index * hour);
    const subscription = index >= 22;
    return {
      start: start.toISOString(),
      end: new Date(start.getTime() + hour).toISOString(),
      slices: [
        ...(index === 3 ? [{ key: "paid", credits: credits(10) }] : []),
        {
          key: subscription ? "subscription" : "byok",
          credits: credits(value),
        },
      ],
      ...(index === 3 ? { includedCredits: credits(8) } : {}),
    };
  }),
};

const entry = (key: string, label: string, dollars: number, value: number) => ({
  key,
  label,
  credits: credits(dollars),
  tokens: tokens(value),
});

export const usageBreakdownFixture: ReadonlyArray<UsageBreakdownRoute> = [
  {
    route: "paid",
    credits: credits(1454.24),
    tokenFeeCredits: credits(141.32),
    entries: [
      entry("claude_opus", "Claude Opus 5.5", 1021.32, 4.5e9),
      entry("gpt", "GPT", 432.92, 2.1e9),
    ],
    images: [],
    machines: [],
  },
  {
    route: "subscription",
    credits: 0,
    tokenFeeCredits: credits(89.75),
    entries: [],
    images: [],
    machines: [],
  },
  {
    route: "byok",
    credits: 0,
    tokenFeeCredits: credits(171.6),
    entries: [],
    images: [],
    machines: [],
  },
];

export const usageMembersFixture: ReadonlyArray<UsageMemberRow> = [
  {
    principalUserId: "user_sample_alex",
    llmCredits: credits(972.4),
    vmCredits: credits(142.6),
    subscriptionCredits: credits(210),
    byokCredits: credits(315),
    imageCredits: credits(20),
    tokenFeeCredits: credits(88.2),
    totalCredits: credits(1748.2),
    threads: 12,
    tokens: tokens(3.6e9),
  },
  {
    principalUserId: "user_sample_sam",
    llmCredits: credits(481.84),
    vmCredits: 0,
    subscriptionCredits: 0,
    byokCredits: 0,
    imageCredits: 0,
    tokenFeeCredits: credits(53.12),
    totalCredits: credits(534.96),
    threads: 6,
    tokens: tokens(900e6),
  },
  {
    principalUserId: "user_sample_priya",
    llmCredits: 0,
    vmCredits: 0,
    subscriptionCredits: 0,
    byokCredits: 0,
    imageCredits: 0,
    tokenFeeCredits: 0,
    totalCredits: 0,
    threads: 2,
    tokens: tokens(0),
  },
];

export const usageThreadsFixture: UsageThreadPage = {
  page: 1,
  pageCount: 1,
  totalThreads: 3,
  items: [
    {
      jamId: "jam_sample_0001",
      title: "Review flaky checkout test",
      principalUserId: "user_sample_alex",
      totalCredits: credits(214),
      dominantRoute: "paid",
      createdAt: new Date(Date.UTC(2026, 10, 16, 10)).toISOString(),
      lastActivityAt: new Date(Date.UTC(2026, 10, 16, 18)).toISOString(),
      personal: false,
      channel: "thread",
      tokens: 450e6,
      machineHours: 0.4,
    },
    {
      jamId: "jam_sample_0002",
      title: "Polish settings navigation",
      principalUserId: "user_sample_sam",
      totalCredits: credits(186),
      dominantRoute: "paid",
      createdAt: new Date(Date.UTC(2026, 10, 15, 9)).toISOString(),
      lastActivityAt: new Date(Date.UTC(2026, 10, 16, 14)).toISOString(),
      personal: false,
      channel: "thread",
      tokens: 320e6,
      machineHours: 0.2,
    },
    {
      jamId: "jam_sample_0003",
      title: "Investigate pagination",
      principalUserId: "user_sample_priya",
      totalCredits: credits(142),
      dominantRoute: "byok",
      createdAt: new Date(Date.UTC(2026, 10, 14, 8)).toISOString(),
      lastActivityAt: new Date(Date.UTC(2026, 10, 15, 16)).toISOString(),
      personal: true,
      channel: "thread",
      tokens: 210e6,
      machineHours: 0,
    },
  ],
};
