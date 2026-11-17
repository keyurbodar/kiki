import { cx } from "class-variance-authority";
import type { ComponentProps } from "react";
import { Glyph } from "@/components/sidebar-threads/glyphs";
import { Badge } from "@/primitives/badge";
import { DotGridIcon } from "@/primitives/dot-grid-icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";

export type ThreadRunStatus =
  | "working"
  | "waiting"
  | "idle"
  | "failed"
  | "archived";

export type ThreadStatusState =
  | "working"
  | "waiting"
  | "needs-you"
  | "read"
  | "failed";

export const threadStatusLabels: Record<ThreadStatusState, string> = {
  working: "Working",
  waiting: "Waiting",
  "needs-you": "Needs you",
  read: "Read",
  failed: "Failed",
};

const threadStatusClassNames: Record<ThreadStatusState, string> = {
  working: "text-muted-foreground dark:text-progress",
  waiting: "text-muted-foreground",
  "needs-you": "text-primary-ink",
  read: "text-muted-foreground-3",
  failed: "text-destructive",
};

export const isActiveStatus = (status: ThreadRunStatus) =>
  status === "working" || status === "waiting" || status === "failed";

export const threadStatusState = (
  status: ThreadRunStatus,
): ThreadStatusState =>
  status === "failed" || status === "working" || status === "waiting"
    ? status
    : "read";

export type ThreadStatusIconProps = {
  state: ThreadStatusState;
  size?: "xs" | "sm";
  className?: string;
};

export function ThreadStatusIcon({
  state,
  size = "sm",
  className,
}: ThreadStatusIconProps) {
  if (state === "read") {
    return (
      <svg
        viewBox="0 0 14 14"
        role="img"
        aria-label={threadStatusLabels.read}
        className={cx(
          "size-(--icon-sm) shrink-0",
          threadStatusClassNames.read,
          className,
        )}
      >
        <circle cx="7" cy="7" r="3" fill="currentColor" />
      </svg>
    );
  }
  return (
    <DotGridIcon
      size={size}
      state={state}
      data-state={state}
      role="img"
      aria-hidden={false}
      aria-label={threadStatusLabels[state]}
      className={cx(threadStatusClassNames[state], className)}
    />
  );
}

export type ThreadStatusProps = ComponentProps<"span"> & {
  status?: ThreadRunStatus;
  age?: string;
  ageClassName?: string;
};

export function ThreadStatus({
  status = "idle",
  age,
  className,
  ageClassName,
  ...props
}: ThreadStatusProps) {
  return (
    <span
      className={cx(
        "flex min-w-6 shrink-0 items-center justify-end",
        className,
      )}
      {...props}
    >
      {isActiveStatus(status) ? (
        <ThreadStatusIcon state={threadStatusState(status)} />
      ) : (
        <span
          className={cx(
            "block text-2xs leading-none font-normal text-muted-foreground-2 tabular-nums [text-box:trim-both_cap_alphabetic]",
            ageClassName,
          )}
          suppressHydrationWarning
        >
          {age}
        </span>
      )}
    </span>
  );
}

export function ThreadStatusMark({
  status,
  className,
}: {
  status: ThreadRunStatus;
  className?: string;
}) {
  if (status === "archived") return <ArchivedMark className={className} />;
  if (!isActiveStatus(status)) return null;
  return (
    <ThreadStatusIcon state={threadStatusState(status)} className={className} />
  );
}

export function ArchivedMark({ className }: { className?: string }) {
  return (
    <Glyph
      name="archive"
      role="img"
      aria-hidden={false}
      aria-label="Archived"
      className={cx(
        "size-(--icon-sm) shrink-0 text-muted-foreground-2",
        className,
      )}
    />
  );
}

export function NeedsYouDot({ className }: { className?: string }) {
  return (
    <span
      role="img"
      aria-label="Waiting on you"
      className={cx(
        "block size-1.5 shrink-0 rounded-full bg-(--primary)",
        className,
      )}
    />
  );
}

export const countLabel = (count: number) =>
  count > 99 ? "99+" : String(count);

export const mentionCountLabel = (count: number) =>
  `${count} unread ${count === 1 ? "mention" : "mentions"} of you`;

export function MentionCountBadge({
  count,
  detail,
  className,
}: {
  count: number;
  detail?: string;
  className?: string;
}) {
  if (count <= 0) return null;
  const label = mentionCountLabel(count);
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Badge
            variant="filled"
            size="count"
            color="accent"
            interactive={false}
            aria-label={label}
            className={cx("h-3.5 min-w-4.5 shrink-0 gap-0 px-1", className)}
          >
            {countLabel(count)}
          </Badge>
        }
      />
      <TooltipContent side="bottom">{detail ?? label}</TooltipContent>
    </Tooltip>
  );
}

export function CrewCountBadge({
  count,
  className,
}: {
  count: number;
  className?: string;
}) {
  if (count <= 0) return null;
  return (
    <Badge
      variant="filled"
      size="count"
      color="accent"
      interactive={false}
      aria-label={`${count} waiting on you in the crew`}
      className={cx("h-3.5 min-w-4.5 shrink-0 gap-0 px-1", className)}
    >
      {countLabel(count)}
    </Badge>
  );
}
