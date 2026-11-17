import { useAtomValue } from "@effect/atom-react";
import { cx as cn } from "class-variance-authority";
import { AsyncResult } from "effect/reactivity";
import type { ReactNode } from "react";
import type { OrgId } from "@/data/api/schemas/ids";
import type {
  IssueColor,
  IssuePriority,
  IssueStateIcon as IssueStateIconName,
  IssueStatus,
} from "@/data/api/schemas/issue";
import { organizationsAtom } from "@/data/atoms/session";
import { Icon } from "@/primitives/icon";
import type { IconId } from "@/primitives/icon/icon-ids";

/** Capy's issue colour keys mapped to their text and swatch utilities. */
export const issueColorClasses: Record<
  IssueColor,
  { label: string; text: string; swatch: string }
> = {
  gray: {
    label: "Gray",
    text: "text-muted-foreground-3",
    swatch: "bg-muted-foreground-3",
  },
  blue: { label: "Blue", text: "text-info", swatch: "bg-info" },
  purple: { label: "Purple", text: "text-complete", swatch: "bg-complete" },
  pink: { label: "Pink", text: "text-pink", swatch: "bg-pink" },
  red: { label: "Red", text: "text-destructive", swatch: "bg-destructive" },
  orange: { label: "Orange", text: "text-orange", swatch: "bg-orange" },
  yellow: { label: "Yellow", text: "text-progress", swatch: "bg-progress" },
  lime: { label: "Lime", text: "text-lime", swatch: "bg-lime" },
  green: { label: "Green", text: "text-success", swatch: "bg-success" },
};

/** The icon and colour each built-in status starts with. */
export const issueStatusDefaults: Record<
  IssueStatus,
  { icon: IssueStateIconName; color: IssueColor }
> = {
  backlog: { icon: "dashed", color: "gray" },
  todo: { icon: "empty", color: "gray" },
  in_progress: { icon: "half", color: "yellow" },
  in_review: { icon: "progress", color: "green" },
  done: { icon: "check", color: "purple" },
  canceled: { icon: "x", color: "gray" },
};

export const issuePriorityLabels: Record<IssuePriority, string> = {
  urgent: "Urgent",
  high: "High",
  normal: "Normal",
  low: "Low",
};

const priorityBars: Record<Exclude<IssuePriority, "urgent">, number> = {
  high: 3,
  normal: 2,
  low: 1,
};

/**
 * Sprite icons standing in for Capy's state glyphs. Capy draws each of its 49
 * state icons as its own component; the shipped sprite holds only some of
 * them, so the rest fall back to the empty circle.
 */
const stateSpriteIcons: Partial<Record<IssueStateIconName, IconId>> = {
  dashed: "circle-dotted",
  half: "progress-50",
  progress: "progress-75",
  check: "check-circle-2",
  x: "circle-x",
  clock: "clock-alert",
  pause: "pause",
  stop: "stop",
  chat: "bubble-text",
  question: "exclamation-circle",
  search: "deep-search",
  pull: "git",
  code: "code-brackets",
  warning: "exclamation-triangle",
  alert: "warning-sign",
  circlecheck: "circle-check",
  checkmark: "check-circle-2-outline",
  minus: "square-minus",
};

function EmptyCircle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 14 14" aria-hidden className={className}>
      <circle
        cx="7"
        cy="7"
        r="5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
      />
    </svg>
  );
}

export function IssueStateIcon({
  icon,
  color,
  className,
}: {
  icon: IssueStateIconName;
  color: IssueColor;
  className?: string;
}) {
  const classes = cn(
    "size-(--icon-sm) shrink-0",
    issueColorClasses[color].text,
    className,
  );
  const sprite = stateSpriteIcons[icon];
  return sprite === undefined ? (
    <EmptyCircle className={classes} />
  ) : (
    <Icon name={sprite} className={classes} />
  );
}

export function IssuePriorityIcon({
  priority,
  className,
}: {
  priority: IssuePriority;
  className?: string;
}) {
  const base = cn("size-(--icon-sm) shrink-0", className);
  if (priority === "urgent") {
    return (
      <svg
        viewBox="0 0 16 16"
        aria-hidden
        className={cn(base, "text-destructive")}
      >
        <rect
          x="1.5"
          y="1.5"
          width="13"
          height="13"
          rx="3"
          fill="currentColor"
        />
        <rect
          x="7.25"
          y="4"
          width="1.5"
          height="5"
          rx="0.75"
          className="fill-background"
        />
        <circle cx="8" cy="11.25" r="0.9" className="fill-background" />
      </svg>
    );
  }
  const filled = priorityBars[priority];
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden
      className={cn(base, "text-muted-foreground-1")}
    >
      {[0, 1, 2].map((bar) => (
        <rect
          key={bar}
          x={2 + bar * 4.5}
          y={10 - bar * 3.5}
          width="3"
          height={4 + bar * 3.5}
          rx="1"
          fill="currentColor"
          opacity={bar < filled ? 1 : 0.25}
        />
      ))}
    </svg>
  );
}

export function IssueLabelDot({
  color,
  className,
}: {
  color: IssueColor;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "size-2 shrink-0 rounded-full",
        (issueColorClasses[color] ?? issueColorClasses.gray).swatch,
        className,
      )}
    />
  );
}

/** One label/value row of the issue properties list. */
export function IssuePropertyRow({
  icon,
  label,
  children,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-7 items-start gap-2 py-0.5">
      <span className="flex h-6 w-24 shrink-0 items-center gap-2 text-xs text-muted-foreground-2 pointer-coarse:w-28 [&_svg]:size-(--icon-xs) [&_svg]:text-icon-muted">
        {icon}
        {label}
      </span>
      <div className="flex min-h-6 min-w-0 flex-1 items-center gap-2">
        {children}
      </div>
    </div>
  );
}

/** The signed-in org. kiki has one org per session until the shell picks one. */
export function useIssueOrgId(): OrgId | undefined {
  const organizations = useAtomValue(organizationsAtom);
  return AsyncResult.isSuccess(organizations)
    ? organizations.value[0]?.id
    : undefined;
}
