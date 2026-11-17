import { AsyncResult } from "effect/reactivity";

export type SettingsScope = "you" | "org";

export type SettingsAgentPageId = "threads" | "git";

export const settingsAgentPageCopy: Record<
  SettingsAgentPageId,
  {
    title: string;
    description: string;
    to: "/settings/threads" | "/settings/git";
  }
> = {
  threads: {
    title: "Threads",
    description: "How Capy names, runs, and archives threads",
    to: "/settings/threads",
  },
  git: {
    title: "Git & pull requests",
    description: "How Capy commits and handles pull requests",
    to: "/settings/git",
  },
};

/** The hash that opens the page on the Org scope (Capy's org default model link). */
export const orgScopeHash = "org-default-model";

export const titlePromptMaxLength = 2000;

export const defaultTaskLimits = { concurrent: 8, nestedDepth: 3 } as const;

export const archiveIdleDays = [3, 7, 14, 30, 90] as const;

export const archiveIdleOptions = [
  { value: "off", label: "Off" },
  ...archiveIdleDays.map((days) => ({
    value: String(days),
    label: `After ${days} days`,
  })),
];

export const archiveIdleValue = (value: string) =>
  archiveIdleDays.find((days) => String(days) === value) ?? null;

export type TitleTrigger = "pull_opened" | "first_run_ended";

export const titleTriggers: readonly TitleTrigger[] = [
  "pull_opened",
  "first_run_ended",
];

export type TitleTriggerChoice = "never" | TitleTrigger | "both";

export const titleTriggerOptions: ReadonlyArray<{
  value: TitleTriggerChoice;
  label: string;
}> = [
  { value: "never", label: "Never" },
  { value: "pull_opened", label: "A pull request opens" },
  { value: "first_run_ended", label: "Capy finishes the first message" },
  { value: "both", label: "Either happens" },
];

export const titleTriggerChoice = (
  triggers: ReadonlyArray<TitleTrigger>,
): TitleTriggerChoice =>
  triggers.includes("pull_opened")
    ? triggers.includes("first_run_ended")
      ? "both"
      : "pull_opened"
    : triggers.includes("first_run_ended")
      ? "first_run_ended"
      : "never";

export const titleTriggersFor = (choice: TitleTriggerChoice): TitleTrigger[] =>
  choice === "never" ? [] : choice === "both" ? [...titleTriggers] : [choice];

export type TaskLimitKey = "concurrent" | "nestedDepth";

export type TaskLimits = { concurrent?: number; nestedDepth?: number };

export type FeedbackMode = "off" | "listen" | "react";
export type CiMode = "off" | "once" | "always";
export type ConflictMode = "ask" | "react" | "ignore";

export type FeedbackSettings = {
  humanMode: FeedbackMode;
  botMode: FeedbackMode;
  ciMode: CiMode;
  conflictMode: ConflictMode;
  conflictMaxThreadAgeDays: number;
  botAllowlist: string[];
  prDraftDefault: boolean;
  prBadge: boolean;
};

export type FeedbackOverrides = Partial<FeedbackSettings>;

export type CommitAuthor = "user" | "capy";

export type GitPreferences = {
  commitAuthor?: CommitAuthor;
  coAuthor?: boolean;
  commitEmail?: string;
  branchPrefix?: string;
};

export type AgentPreferences = {
  github: FeedbackOverrides | undefined;
  tasks: TaskLimits | undefined;
  git: GitPreferences | undefined;
  gitSigning: { signCommits?: boolean } | undefined;
  archiveIdleAfterDays: number | undefined;
};

type Raw = Record<string, unknown>;

const record = (value: unknown): Raw | undefined =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Raw)
    : undefined;

const str = (value: unknown) => (typeof value === "string" ? value : undefined);
const num = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;
const bool = (value: unknown) =>
  typeof value === "boolean" ? value : undefined;
const mode = (value: unknown): FeedbackMode | undefined =>
  value === "off" || value === "listen" || value === "react"
    ? value
    : undefined;
const ciMode = (value: unknown): CiMode | undefined =>
  value === "off" || value === "once" || value === "always" ? value : undefined;
const conflictMode = (value: unknown): ConflictMode | undefined =>
  value === "ask" || value === "react" || value === "ignore"
    ? value
    : undefined;
const logins = (value: unknown) =>
  Array.isArray(value)
    ? value.filter((login): login is string => typeof login === "string")
    : undefined;

const defined = <T extends Raw>(value: T) =>
  Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined),
  ) as T;

export const readFeedbackOverrides = (value: unknown) => {
  const raw = record(value);
  if (raw === undefined) return undefined;
  return defined<FeedbackOverrides>({
    humanMode: mode(raw.humanMode),
    botMode: mode(raw.botMode),
    ciMode: ciMode(raw.ciMode),
    conflictMode: conflictMode(raw.conflictMode),
    conflictMaxThreadAgeDays: num(raw.conflictMaxThreadAgeDays),
    botAllowlist: logins(raw.botAllowlist),
    prDraftDefault: bool(raw.prDraftDefault),
    prBadge: bool(raw.prBadge),
  });
};

/** The organization's pull request feedback settings, with Capy's defaults for missing fields. */
export const readFeedbackSettings = (value: unknown): FeedbackSettings => {
  const raw = readFeedbackOverrides(value) ?? {};
  return {
    humanMode: raw.humanMode ?? "react",
    botMode: raw.botMode ?? "react",
    ciMode: raw.ciMode ?? "once",
    conflictMode: raw.conflictMode ?? "ask",
    conflictMaxThreadAgeDays: raw.conflictMaxThreadAgeDays ?? 3,
    botAllowlist: raw.botAllowlist ?? [],
    prDraftDefault: raw.prDraftDefault ?? false,
    prBadge: raw.prBadge ?? true,
  };
};

export const readAgentPreferences = (
  preferences: Raw | undefined,
): AgentPreferences => {
  const tasks = record(preferences?.tasks);
  const git = record(preferences?.git);
  const signing = record(preferences?.gitSigning);
  const author = git?.commitAuthor;
  return {
    github: readFeedbackOverrides(preferences?.github),
    tasks:
      tasks &&
      defined<TaskLimits>({
        concurrent: num(tasks.concurrent),
        nestedDepth: num(tasks.nestedDepth),
      }),
    git:
      git &&
      defined<GitPreferences>({
        commitAuthor:
          author === "user" || author === "capy" ? author : undefined,
        coAuthor: bool(git.coAuthor),
        commitEmail: str(git.commitEmail),
        branchPrefix: str(git.branchPrefix),
      }),
    gitSigning: signing && defined({ signCommits: bool(signing.signCommits) }),
    archiveIdleAfterDays: num(preferences?.archiveIdleAfterDays),
  };
};

export type SettingsQuery<T> = {
  value: T | undefined;
  loading: boolean;
  failed: boolean;
};

/** Keeps pending, failed and empty responses distinct so the UI never spins forever. */
export const settingsQuery = <A, E, T>(
  result: AsyncResult.AsyncResult<A, E>,
  read: (value: A) => T,
): SettingsQuery<T> => {
  const value = AsyncResult.isSuccess(result)
    ? read(result.value)
    : AsyncResult.isFailure(result) && result.previousSuccess._tag === "Some"
      ? read(result.previousSuccess.value as A)
      : undefined;
  return {
    value,
    loading: result.waiting && value === undefined,
    failed: AsyncResult.isFailure(result) && value === undefined,
  };
};

/** Capy shows the server's message for its own API errors and the fallback for anything else. */
export const errorMessage = (error: unknown, fallback: string) => {
  const raw = record(error);
  const tag = str(raw?._tag);
  const message = str(raw?.message);
  return tag?.startsWith("capy/") && message ? message : fallback;
};

export type NumberDraft =
  | { kind: "revert" }
  | { kind: "keep" }
  | { kind: "set"; value: number | undefined };

/** What committing an inherited number field's draft does: revert it, keep the value, or save an override (undefined clears it). */
export const resolveNumberDraft = (
  draft: string,
  {
    current,
    inherited,
    min,
    max,
  }: {
    current: number | undefined;
    inherited: number;
    min: number;
    max: number;
  },
): NumberDraft => {
  const value = Number(draft);
  if (
    draft.trim() === "" ||
    !Number.isInteger(value) ||
    value < min ||
    value > max
  )
    return { kind: "revert" };
  const next = value === inherited ? undefined : value;
  return next === current ? { kind: "keep" } : { kind: "set", value: next };
};

const second = 1000;
const minute = 60 * second;
const hour = 60 * minute;
const day = 24 * hour;
const week = 7 * day;
const year = 365 * day;

/** Capy's relative time: "just now", "5m ago", "3d ago", "in 2h". */
export const relativeTime = (date: Date | number, now = Date.now()) => {
  const delta = now - (typeof date === "number" ? date : date.getTime());
  const size = Math.abs(delta);
  if (size < 5 * second) return "just now";
  const amount =
    size < minute
      ? `${Math.floor(size / second)}s`
      : size < hour
        ? `${Math.floor(size / minute)}m`
        : size < day
          ? `${Math.floor(size / hour)}h`
          : size < week
            ? `${Math.floor(size / day)}d`
            : size < year
              ? `${Math.floor(size / week)}w`
              : `${Math.floor(size / year)}y`;
  return delta < 0 ? `in ${amount}` : `${amount} ago`;
};
