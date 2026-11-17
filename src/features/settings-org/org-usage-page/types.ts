export type UsageBucketSlice = {
  key: string;
  credits: number;
};

export type UsageBucket = {
  start: string;
  end: string;
  slices: ReadonlyArray<UsageBucketSlice>;
  includedCredits?: number;
};

export type UsageSeries = {
  bucket: "hour" | "day";
  keys: ReadonlyArray<{ key: string; label: string }>;
  buckets: ReadonlyArray<UsageBucket>;
};

export type UsageSummary = {
  period: { start: string; end: string } | null;
  balance: { remainingCredits: number; unlimited: boolean } | null;
  included: ReadonlyArray<{
    feature: string;
    used: number;
    granted: number;
    resetsAt?: string | null;
    breakdown?: ReadonlyArray<{ key: string; count: number; amount: number }>;
  }>;
};

export type UsageBreakdownEntry = {
  key: string;
  label: string;
  credits: number;
  tokens: { inputTokens: number; outputTokens: number };
};

export type UsageBreakdownRoute = {
  route: string;
  credits: number;
  tokenFeeCredits: number;
  entries: ReadonlyArray<UsageBreakdownEntry>;
  images: ReadonlyArray<{ endpoint: string; label: string; credits: number }>;
  machines: ReadonlyArray<{ size: string; credits: number; vmMs: number }>;
};

export type UsageMemberRow = {
  principalUserId: string | null;
  llmCredits: number;
  vmCredits: number;
  subscriptionCredits: number;
  byokCredits: number;
  imageCredits: number;
  tokenFeeCredits: number;
  totalCredits: number;
  threads: number;
  tokens?: {
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
  };
};

export type UsageThreadRow = {
  jamId: string;
  title: string | null;
  principalUserId: string | null;
  totalCredits: number;
  dominantRoute: string;
  createdAt: string;
  lastActivityAt: string;
  personal: boolean;
  channel: string;
  threadCount?: number;
  tokens: number;
  machineHours: number;
};

export type UsageThreadPage = {
  page: number;
  pageCount: number;
  totalThreads: number;
  items: ReadonlyArray<UsageThreadRow>;
};

export type Principal = {
  name: string;
  imageUrl: string | null;
  kind: "member" | "service" | "review";
  icon?: string;
};

export type UsageRange = { from: Date; to: Date; timeZone: string };

export type UsageScopeKey = string;
