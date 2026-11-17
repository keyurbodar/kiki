export type PullState =
  | "ready"
  | "pending"
  | "draft"
  | "merged"
  | "failed"
  | "closed";

export type ChecksState = "passing" | "failing" | "pending" | "none";

export type StatusColor =
  | "neutral"
  | "accent"
  | "success"
  | "danger"
  | "warning"
  | "info";

export type LocalPull = {
  id: string;
  jamId: string;
  userId: string;
  repo: string;
  number: number;
  url: string;
};

export type LocalPullDetail = {
  title: string;
  state: PullState;
  baseRefName: string;
  headRefName: string;
  additions: number;
  deletions: number;
  checksState: ChecksState | null;
};

export type DevicePullError =
  | { offline: true }
  | { refused: "auth" | "missing" | "other" }
  | { failed: true; message: string };

export type DevicePullAnswer = { pull: LocalPullDetail } | DevicePullError;

export type LocalPullRowState =
  | { kind: "loading" }
  | {
      kind: "live";
      detail: LocalPullDetail;
      error?: DevicePullError;
      refreshing: boolean;
      onRefresh: () => void;
    }
  | {
      kind: "error";
      error: DevicePullError;
      refreshing: boolean;
      onRefresh: () => void;
    }
  | { kind: "tip"; tip: "signin" | "connect"; onOpen?: () => void }
  | { kind: "plain" };

export const repoName = (repo: string) => repo.split("/")[1] ?? repo;

export const checksColor = (state: ChecksState): StatusColor =>
  state === "passing"
    ? "success"
    : state === "failing"
      ? "danger"
      : state === "pending"
        ? "warning"
        : "neutral";

export const statusDotColors: Record<StatusColor, string> = {
  neutral: "bg-muted-foreground-3",
  accent: "bg-primary",
  success: "bg-success",
  danger: "bg-destructive",
  warning: "bg-warning",
  info: "bg-info",
};

export const signInTip = (deviceNoun: string) =>
  `Sign in to GitHub on this ${deviceNoun} to reveal details`;

export const connectTip = "Connect GitHub to reveal details";

export const devicePullErrorText = (
  error: DevicePullError,
  deviceNoun: string,
) =>
  "offline" in error
    ? "Device offline"
    : "refused" in error
      ? error.refused === "auth" || error.refused === "missing"
        ? signInTip(deviceNoun)
        : connectTip
      : error.message;

export type LocalPullRowInput = {
  reachable: boolean;
  answer: DevicePullAnswer | undefined;
  error?: DevicePullError;
  refreshing: boolean;
  onRefresh: () => void;
  githubLinked: boolean;
  onConnect?: () => void;
};

export function localPullRowState(input: LocalPullRowInput): LocalPullRowState {
  const { answer } = input;
  if (!input.reachable)
    return input.githubLinked
      ? { kind: "plain" }
      : { kind: "tip", tip: "connect", onOpen: input.onConnect };
  if (answer === undefined) return { kind: "loading" };
  if ("pull" in answer)
    return {
      kind: "live",
      detail: answer.pull,
      error: input.error,
      refreshing: input.refreshing,
      onRefresh: input.onRefresh,
    };
  if ("failed" in answer || "offline" in answer)
    return {
      kind: "error",
      error: answer,
      refreshing: input.refreshing,
      onRefresh: input.onRefresh,
    };
  return {
    kind: "tip",
    tip:
      answer.refused === "auth" || answer.refused === "missing"
        ? "signin"
        : "connect",
    onOpen: input.onConnect,
  };
}
