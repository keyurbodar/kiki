import { cx } from "@/components/activity-card";
import {
  DraftIcon,
  MergedIcon,
  PullRequestIcon,
  RequestClosedIcon,
} from "@/components/pull-view/icons";
import {
  type DiffBreakdown,
  diffCategories,
  diffCategoryLabel,
  hasDiffBreakdown,
  type PullState,
  visibleDiffCounts,
} from "@/components/pull-view/pull-model";
import {
  PreviewCard,
  PreviewCardContent,
  PreviewCardTrigger,
} from "@/primitives/preview-card";

const stateIcons = {
  ready: { Icon: PullRequestIcon, className: "text-success" },
  draft: { Icon: DraftIcon, className: "text-muted-foreground-2" },
  merged: { Icon: MergedIcon, className: "text-complete" },
  closed: { Icon: RequestClosedIcon, className: "text-destructive" },
} as const;

export function PullStateIcon({
  state,
  className,
}: {
  state: PullState;
  className?: string;
}) {
  const { Icon, className: tone } = stateIcons[state];
  return <Icon className={cx("size-3 shrink-0", tone, className)} />;
}

export type DiffStatProps = {
  additions: number;
  deletions: number;
  diffBreakdown: DiffBreakdown | null;
};

function Counts({
  additions,
  deletions,
}: {
  additions: number;
  deletions: number;
}) {
  return (
    <>
      <span className="text-diff-add">+{additions}</span>{" "}
      <span className="text-diff-del">-{deletions}</span>
    </>
  );
}

export function DiffStat({
  additions,
  deletions,
  diffBreakdown,
}: DiffStatProps) {
  if (!hasDiffBreakdown(diffBreakdown)) {
    return (
      <span className="shrink-0 tabular-nums">
        <Counts additions={additions} deletions={deletions} />
      </span>
    );
  }
  const visible = visibleDiffCounts(additions, deletions, diffBreakdown);
  return (
    <PreviewCard>
      <PreviewCardTrigger
        data-track-owner="shared/diff-stat.tsx#SmartDiffStat:PreviewCardTrigger[onClick=stopClick]"
        render={<button type="button" />}
        aria-label="Diff counts and hidden file categories"
        className="relative shrink-0 cursor-default rounded tabular-nums outline-none focus-visible:outline-ring-inset"
      >
        <Counts {...visible} />
      </PreviewCardTrigger>
      <PreviewCardContent
        data-track-owner="shared/diff-stat.tsx#SmartDiffStat:PreviewCardContent[onClick=stopClick]"
        side="bottom"
        sideOffset={4}
        className="flex w-72 max-w-[calc(100dvw-1.5rem)] flex-col gap-0.5 rounded-(--radius-card) border-hairline border-border-1 bg-popover p-2 shadow-plate"
      >
        {diffCategories.map((category) => {
          const entry = diffBreakdown[category];
          return (
            <div
              key={category}
              className="flex h-6 items-center gap-2 px-1.5 text-xs tabular-nums text-muted-foreground-3"
            >
              <span className="flex-1">{diffCategoryLabel[category]}</span>
              <span className="shrink-0">
                {entry.files} {entry.files === 1 ? "file" : "files"}
              </span>
              <span className="w-14 shrink-0 text-right">
                +{entry.additions}
              </span>
              <span className="w-12 shrink-0 text-right">
                -{entry.deletions}
              </span>
            </div>
          );
        })}
        <div className="h-px bg-border-1" />
        <div className="flex h-6 items-center gap-2 px-1.5 text-xs tabular-nums">
          <span className="flex-1">Total</span>
          <span
            className={cx(
              "w-14 shrink-0 text-right",
              additions > 0 ? "text-diff-add" : "text-muted-foreground-2",
            )}
          >
            +{additions}
          </span>
          <span
            className={cx(
              "w-12 shrink-0 text-right",
              deletions > 0 ? "text-diff-del" : "text-muted-foreground-2",
            )}
          >
            -{deletions}
          </span>
        </div>
      </PreviewCardContent>
    </PreviewCard>
  );
}
