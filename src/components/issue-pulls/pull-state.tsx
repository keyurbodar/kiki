import { cx } from "class-variance-authority";
import type { SVGProps } from "react";
import type { IssuePullState } from "@/data/api/schemas/issue";

/** A linked pull request's display state: open PRs split by their checks. */
export type IssuePullDisplayState =
  | "ready"
  | "pending"
  | "draft"
  | "merged"
  | "failed"
  | "closed";

/** An open PR shows its checks state when known, else pending. */
export const pullDisplayState = (
  pull: { readonly state: IssuePullState },
  checks: IssuePullDisplayState | undefined,
): IssuePullDisplayState =>
  checks ?? (pull.state === "open" ? "pending" : pull.state);

export const issuePullStateWords: Record<IssuePullDisplayState, string> = {
  ready: "open",
  pending: "checks pending",
  draft: "draft",
  merged: "merged",
  failed: "failing",
  closed: "closed",
};

/** Count groups sort failing first and merged last. */
export const issuePullStateOrder: Record<IssuePullDisplayState, number> = {
  failed: 0,
  closed: 1,
  ready: 2,
  pending: 3,
  draft: 4,
  merged: 5,
};

const line = {
  stroke: "currentColor",
  strokeWidth: "2",
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

const branch = (x: number) => (
  <>
    <circle cx={x} cy="6" r="2" {...line} />
    <circle cx={x} cy="18" r="2" {...line} />
    <circle cx={24 - x} cy="18" r="2" {...line} />
    <path d={`M${x} 8V16`} {...line} />
  </>
);

const glyphs: Record<
  "pull" | "draft" | "merged" | "failed" | "closed",
  SVGProps<SVGSVGElement>["children"]
> = {
  pull: (
    <>
      {branch(6)}
      <path d="M13 6H15C16.6569 6 18 7.34315 18 9V16" {...line} />
      <path d="M14 4L12 6L14 8" {...line} />
    </>
  ),
  draft: (
    <>
      {branch(6.5)}
      <path
        d="M17.51 6H17.5M18 6C18 6.27614 17.7761 6.5 17.5 6.5C17.2239 6.5 17 6.27614 17 6C17 5.72386 17.2239 5.5 17.5 5.5C17.7761 5.5 18 5.72386 18 6Z"
        {...line}
      />
      <path
        d="M17.51 11.25H17.5M18 11.25C18 11.5261 17.7761 11.75 17.5 11.75C17.2239 11.75 17 11.5261 17 11.25C17 10.9739 17.2239 10.75 17.5 10.75C17.7761 10.75 18 10.9739 18 11.25Z"
        {...line}
      />
    </>
  ),
  merged: (
    <>
      {branch(6)}
      <path d="M8 6H15C16.6569 6 18 7.34315 18 9V16" {...line} />
    </>
  ),
  failed: (
    <path
      d="M14 13.5L12 11.5M12 11.5L10 9.5M12 11.5L14 9.5M12 11.5L10 13.5M20 11.9123V7.17737C20 6.32338 19.4578 5.56361 18.6502 5.286L12.9752 3.33524C12.3432 3.11799 11.6568 3.11799 11.0248 3.33524L5.34984 5.286C4.54224 5.56361 4 6.32338 4 7.17737V11.9123C4 16.8848 8 19 12 21.1579C16 19 20 16.8848 20 11.9123Z"
      {...line}
    />
  ),
  closed: (
    <>
      {branch(6.5)}
      <path d="M17.5 11V16" {...line} />
      <path d="M15.75 4.25L19.25 7.75M19.25 4.25L15.75 7.75" {...line} />
    </>
  ),
};

const states: Record<
  IssuePullDisplayState,
  { glyph: keyof typeof glyphs; className: string }
> = {
  ready: { glyph: "pull", className: "text-success" },
  pending: { glyph: "pull", className: "text-warning-fg" },
  draft: { glyph: "draft", className: "text-muted-foreground-2" },
  merged: { glyph: "merged", className: "text-complete" },
  failed: { glyph: "failed", className: "text-destructive" },
  closed: { glyph: "closed", className: "text-destructive" },
};

export type IssuePullStateIconProps = Omit<
  SVGProps<SVGSVGElement>,
  "children"
> & { state: IssuePullDisplayState };

export function IssuePullStateIcon({
  state,
  className,
  ...props
}: IssuePullStateIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={cx("size-3 shrink-0", states[state].className, className)}
      {...props}
    >
      {glyphs[states[state].glyph]}
    </svg>
  );
}

export type IssuePullStateCountsProps = {
  groups: ReadonlyArray<{ state: IssuePullDisplayState; count: number }>;
  className?: string;
};

/** Icon and count per state, failing first. */
export function IssuePullStateCounts({
  groups,
  className,
}: IssuePullStateCountsProps) {
  if (groups.length === 0) return null;
  return (
    <span className={cx("flex shrink-0 items-center gap-1.5", className)}>
      {[...groups]
        .sort(
          (a, b) => issuePullStateOrder[a.state] - issuePullStateOrder[b.state],
        )
        .map((group) => (
          <span
            key={group.state}
            title={`${group.count} ${issuePullStateWords[group.state]}`}
            className={cx(
              "flex items-center gap-0.5 tabular-nums",
              states[group.state].className,
            )}
          >
            <IssuePullStateIcon state={group.state} />
            {group.count}
          </span>
        ))}
    </span>
  );
}

/** One count group per state present, in first-seen order. */
export const groupPullStates = (
  pulls: ReadonlyArray<{ state: IssuePullDisplayState }>,
) =>
  [...new Set(pulls.map((pull) => pull.state))].map((state) => ({
    state,
    count: pulls.filter((pull) => pull.state === state).length,
  }));
