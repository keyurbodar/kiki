import { Link } from "@tanstack/react-router";
import { formatAge } from "@/features/threads/threads-page/model";
import { Icon } from "@/primitives/icon";
import type { IconId } from "@/primitives/icon/icon-ids";

export type MobilePullState = "open" | "draft" | "ready" | "merged" | "closed";

export type MobilePullListItem = {
  readonly id: string;
  readonly number: number;
  readonly title: string;
  readonly state: MobilePullState;
  readonly repoFullName: string;
  readonly additions: number;
  readonly deletions: number;
  readonly updatedAt: Date;
  /** The thread that opened the pull, drawn as a badge when there is room. */
  readonly threadCode: string | null;
};

export type MobilePullSection = {
  readonly id: string;
  readonly label: string;
  readonly members: ReadonlyArray<MobilePullListItem>;
};

const stateIcons: Record<MobilePullState, IconId> = {
  open: "circle-dashed",
  draft: "circle-dotted",
  ready: "circle-check",
  merged: "circle-check",
  closed: "circle-x",
};

const stateClass: Record<MobilePullState, string> = {
  open: "text-success",
  draft: "text-muted-foreground-3",
  ready: "text-success",
  merged: "text-progress",
  closed: "text-muted-foreground-3",
};

export type MobilePullRowProps = {
  pull: MobilePullListItem;
  now: number;
  repoInitials?: (repoFullName: string) => string;
};

/**
 * One pull on a phone: state glyph, number, repository mark, title, then the
 * thread and diff badges that the container queries drop first.
 */
export function MobilePullRow({ pull, now, repoInitials }: MobilePullRowProps) {
  return (
    <div className="group/row relative block">
      <Link
        to="/pull/$owner/$repo/$prNumber"
        params={{
          owner: pull.repoFullName.split("/")[0] ?? "",
          repo: pull.repoFullName.split("/")[1] ?? "",
          prNumber: String(pull.number),
        }}
        data-pull-row={pull.id}
        className="flex h-11 items-center gap-2 rounded px-2 outline-none select-none transition-colors duration-100 [-webkit-touch-callout:none] hover:bg-section focus-visible:outline-ring-inset data-[selected]:bg-section"
      >
        <span className="flex w-4 shrink-0 items-center justify-center">
          <Icon
            name={stateIcons[pull.state]}
            label={pull.state}
            className={`size-3 shrink-0 ${stateClass[pull.state]}`}
          />
        </span>
        <span className="@max-lg/list:hidden w-(--pull-code-width) shrink-0 text-sm font-normal whitespace-nowrap text-muted-foreground-2 tabular-nums">
          #{pull.number}
        </span>
        <span className="relative flex size-4 shrink-0 items-center justify-center overflow-hidden rounded bg-secondary text-2xs">
          {repoInitials?.(pull.repoFullName) ?? null}
        </span>
        <span className="mask-fade-r min-w-0 flex-1 overflow-hidden text-sm font-medium whitespace-nowrap text-foreground">
          {pull.title}
        </span>
        <span className="hidden shrink-0 items-center gap-1.5 @lg/list:flex">
          {pull.threadCode === null ? null : (
            <span className="@max-xl/list:hidden flex h-5 shrink-0 items-center gap-1 rounded-full border-hairline border-border-2 bg-button px-2 text-xs font-normal text-foreground">
              {pull.threadCode}
            </span>
          )}
          <span className="@max-2xl/list:hidden shrink-0 text-xs font-medium tabular-nums">
            <span className="text-diff-add">+{pull.additions}</span>
            <span className="text-diff-del">-{pull.deletions}</span>
          </span>
        </span>
        <span className="w-10 shrink-0 text-right text-xs font-normal text-muted-foreground-2 tabular-nums">
          {formatAge(pull.updatedAt, { now, minified: true })}
        </span>
      </Link>
    </div>
  );
}
