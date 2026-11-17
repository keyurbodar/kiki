import type { ComponentProps } from "react";
import { Icon, type IconId } from "@/primitives/icon";

export type PullRequestState =
  | "ready"
  | "pending"
  | "draft"
  | "merged"
  | "failed"
  | "closed";

const STATE: Record<PullRequestState, { icon: IconId; tone: string }> = {
  ready: { icon: "pull-request", tone: "text-success" },
  pending: { icon: "pull-request", tone: "text-warning-fg" },
  draft: { icon: "draft", tone: "text-muted-foreground-2" },
  merged: { icon: "merged", tone: "text-complete" },
  failed: { icon: "shield-crossed", tone: "text-destructive" },
  closed: { icon: "request-closed", tone: "text-destructive" },
};

export type PullRequestStateIconProps = Omit<
  ComponentProps<typeof Icon>,
  "name"
> & { state: PullRequestState };

export function PullRequestStateIcon({
  state,
  className,
  ...props
}: PullRequestStateIconProps) {
  const { icon, tone } = STATE[state];
  return (
    <Icon
      name={icon}
      className={["size-3 shrink-0", tone, className].filter(Boolean).join(" ")}
      {...props}
    />
  );
}

export type DiffStatProps = { additions: number; deletions: number };

export function DiffStat({ additions, deletions }: DiffStatProps) {
  return (
    <span className="shrink-0 tabular-nums">
      <span className="text-diff-add">+{additions}</span>{" "}
      <span className="text-diff-del">-{deletions}</span>
    </span>
  );
}
