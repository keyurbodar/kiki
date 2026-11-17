import type { ReviewTier } from "@/components/review-mode";
import { reviewTierCopy } from "@/components/review-mode";

export type ReviewRoundStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "stale";

export interface ReviewRound {
  readonly status: ReviewRoundStatus;
  readonly headSha: string | null;
  readonly title: string | null;
  readonly failureMessage: string | null;
  readonly failureReason: string | null;
}

export type FindingSeverity = "low" | "medium" | "high";

export interface ReviewFinding {
  readonly id: string;
  readonly status: "open" | "resolved" | "irrelevant";
  readonly kind: "issue" | "note";
  readonly severity: FindingSeverity | null;
  readonly title: string;
  readonly body: string;
  readonly path: string | null;
  readonly line: number | null;
}

export interface CapyReview {
  readonly threadId: string | null;
  readonly reviewedHeadSha: string | null;
  readonly rounds: ReadonlyArray<ReviewRound>;
  readonly findings: ReadonlyArray<ReviewFinding>;
}

export type PullState = "open" | "draft" | "ready" | "merged" | "closed";

export interface ReviewPull {
  readonly id: string;
  readonly state: PullState;
  readonly author: string;
  readonly headSha: string;
}

export const visibleFindingLimit = 5;

const severityRank: Record<FindingSeverity, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

export const bySeverity = (a: ReviewFinding, b: ReviewFinding) =>
  (a.severity === null ? 3 : severityRank[a.severity]) -
  (b.severity === null ? 3 : severityRank[b.severity]);

export const isRoundActive = (round: ReviewRound | undefined) =>
  round !== undefined &&
  (round.status === "running" || round.status === "pending");

export const isPullClosed = (pull: Pick<ReviewPull, "state">) =>
  pull.state === "merged" || pull.state === "closed";

export const countsLabel = (open: number, resolved: number) =>
  [
    open > 0 ? `${open} open` : null,
    resolved > 0 ? `${resolved} resolved` : null,
  ]
    .filter((part) => part !== null)
    .join(" · ");

export const runLabel = (running: boolean, completed: boolean) =>
  running ? "Reviewing" : completed ? "Rerun Capy review" : "Run Capy review";

export const defaultTierLabel = (tier: ReviewTier | null | undefined) =>
  tier === undefined
    ? "Organization default"
    : tier === null
      ? "Organization default · Custom"
      : `Organization default · ${reviewTierCopy[tier].label}`;

export type ReviewStatus =
  | { readonly kind: "running"; readonly text: string }
  | { readonly kind: "idle"; readonly text: string }
  | { readonly kind: "failed"; readonly text: string }
  | {
      readonly kind: "complete";
      readonly text: string;
      readonly meta: string;
    };

export function reviewStatus(
  running: boolean,
  latest: ReviewRound | undefined,
  openCount: number,
  resolvedCount: number,
): ReviewStatus {
  if (running) return { kind: "running", text: "Reviewing the latest changes" };
  if (latest === undefined) return { kind: "idle", text: "Not reviewed yet" };
  if (latest.status === "failed") {
    const detail =
      latest.failureMessage === null
        ? latest.failureReason === null
          ? ""
          : `: ${latest.failureReason}`
        : `: ${latest.failureMessage}`;
    return { kind: "failed", text: `Review failed${detail}` };
  }
  return {
    kind: "complete",
    text:
      latest.title ?? (openCount === 0 ? "No issues found" : "Review complete"),
    meta: countsLabel(openCount, resolvedCount),
  };
}

export interface FindingPartition {
  readonly open: ReadonlyArray<ReviewFinding>;
  readonly resolved: ReadonlyArray<ReviewFinding>;
  readonly shown: ReadonlyArray<ReviewFinding>;
  readonly hidden: number;
  readonly copyable: boolean;
}

export function partitionFindings(
  findings: ReadonlyArray<ReviewFinding>,
  expanded: boolean,
): FindingPartition {
  const open = findings
    .filter((finding) => finding.status === "open")
    .toSorted(bySeverity);
  const resolved = findings.filter((finding) => finding.status !== "open");
  return {
    open,
    resolved,
    shown: expanded
      ? [...open, ...resolved]
      : open.slice(0, visibleFindingLimit),
    hidden: Math.max(0, open.length - visibleFindingLimit) + resolved.length,
    copyable: open.some((finding) => finding.kind !== "note"),
  };
}

export const findingsAsText = (findings: ReadonlyArray<ReviewFinding>) =>
  findings
    .filter((finding) => finding.kind !== "note")
    .map((finding, index) => {
      const where =
        finding.path === null
          ? ""
          : ` (${finding.path}${finding.line === null ? "" : `:${finding.line}`})`;
      return `${index + 1}. ${finding.title}${where}\n${finding.body}`.trimEnd();
    })
    .join("\n\n");

export const reviewedHead = (
  review: CapyReview | null,
  headSha: string,
): boolean =>
  review?.rounds.some(
    (round) => round.status === "completed" && round.headSha === headSha,
  ) ?? false;
