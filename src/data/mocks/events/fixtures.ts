import { threads } from "../fixtures/world.ts";

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
