import { useAtomValue } from "@effect/atom-react";
import { cx } from "class-variance-authority";
import {
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  useSyncExternalStore,
} from "react";
import {
  type DiffBreakdown,
  type DiffCategory,
  diffCategories,
  type HiddenDiffCategories,
  hiddenDiffCategoriesAtom,
} from "@/lib/diff-categories";
import { Popover, PopoverContent, PopoverTrigger } from "@/primitives/popover";
import {
  PreviewCard,
  PreviewCardContent,
  PreviewCardTrigger,
} from "@/primitives/preview-card";

export type DiffStatProps = {
  additions: number;
  deletions: number;
  diffBreakdown?: DiffBreakdown;
};

const categoryLabels: Record<DiffCategory, string> = {
  database: "Database",
  tests: "Tests",
  generated: "Generated",
};

/** Additions and deletions left once hidden categories are taken out. */
export function visibleDiffTotals(
  additions: number,
  deletions: number,
  breakdown: DiffBreakdown,
  hidden: HiddenDiffCategories,
) {
  return diffCategories.reduce(
    (totals, category) => ({
      additions:
        totals.additions -
        (hidden[category] ? breakdown[category].additions : 0),
      deletions:
        totals.deletions -
        (hidden[category] ? breakdown[category].deletions : 0),
    }),
    { additions, deletions },
  );
}

const stopClick = (event: MouseEvent | KeyboardEvent) =>
  event.stopPropagation();

const stopTriggerClick = (event: MouseEvent) => {
  event.preventDefault();
  event.stopPropagation();
};

const coarsePointer = "(hover: none)";

const subscribePointer = (onChange: () => void) => {
  const query = window.matchMedia(coarsePointer);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};

const useCoarsePointer = () =>
  useSyncExternalStore(
    subscribePointer,
    () => window.matchMedia(coarsePointer).matches,
    () => false,
  );

function Counts({
  additions,
  deletions,
}: Omit<DiffStatProps, "diffBreakdown">) {
  return (
    <>
      <span className="text-diff-add">+{additions}</span>{" "}
      <span className="text-diff-del">-{deletions}</span>
    </>
  );
}

const triggerClassName =
  "relative shrink-0 rounded tabular-nums outline-none focus-visible:outline-ring-inset";

const contentClassName = "w-72 max-w-[calc(100dvw-1.5rem)] gap-0.5 p-2";

function Breakdown({
  additions,
  deletions,
  diffBreakdown,
  hidden,
}: Required<DiffStatProps> & { hidden: HiddenDiffCategories }) {
  return (
    <>
      {diffCategories.map((category) => {
        const totals = diffBreakdown[category];
        return (
          <div
            key={category}
            className={cx(
              "flex h-6 items-center gap-2 px-1.5 text-xs tabular-nums",
              hidden[category] ? "text-muted-foreground-3" : "text-foreground",
            )}
          >
            <span className="flex-1">{categoryLabels[category]}</span>
            <span
              className={cx(
                "shrink-0",
                !hidden[category] && "text-muted-foreground-2",
              )}
            >
              {totals.files} {totals.files === 1 ? "file" : "files"}
            </span>
            <span
              className={cx(
                "w-14 shrink-0 text-right",
                !hidden[category] &&
                  (totals.additions > 0
                    ? "text-diff-add"
                    : "text-muted-foreground-2"),
              )}
            >
              {`+${totals.additions}`}
            </span>
            <span
              className={cx(
                "w-12 shrink-0 text-right",
                !hidden[category] &&
                  (totals.deletions > 0
                    ? "text-diff-del"
                    : "text-muted-foreground-2"),
              )}
            >
              {`-${totals.deletions}`}
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
          {`+${additions}`}
        </span>
        <span
          className={cx(
            "w-12 shrink-0 text-right",
            deletions > 0 ? "text-diff-del" : "text-muted-foreground-2",
          )}
        >
          {`-${deletions}`}
        </span>
      </div>
    </>
  );
}

function SmartDiffStat({
  additions,
  deletions,
  diffBreakdown,
}: Required<DiffStatProps>) {
  const hidden = useAtomValue(hiddenDiffCategoriesAtom);
  const coarse = useCoarsePointer();
  const visible = visibleDiffTotals(
    additions,
    deletions,
    diffBreakdown,
    hidden,
  );
  const counts: ReactNode = <Counts {...visible} />;
  const breakdown = (
    <Breakdown
      additions={additions}
      deletions={deletions}
      diffBreakdown={diffBreakdown}
      hidden={hidden}
    />
  );
  if (coarse) {
    return (
      <Popover>
        <PopoverTrigger
          nativeButton={false}
          render={<span />}
          className={cx(
            triggerClassName,
            "cursor-pointer after:absolute after:top-1/2 after:left-1/2 after:size-full after:min-h-11 after:min-w-11 after:-translate-x-1/2 after:-translate-y-1/2",
          )}
          aria-label="Diff counts and hidden file categories"
          onClick={stopTriggerClick}
          onKeyDown={stopClick}
        >
          {counts}
        </PopoverTrigger>
        <PopoverContent
          className={contentClassName}
          onClick={stopTriggerClick}
          onKeyDown={stopClick}
        >
          {breakdown}
        </PopoverContent>
      </Popover>
    );
  }
  return (
    <PreviewCard>
      <PreviewCardTrigger
        render={<span />}
        className={cx(triggerClassName, "cursor-default")}
        aria-label="Diff counts and hidden file categories"
        onClick={stopTriggerClick}
        onKeyDown={stopClick}
      >
        {counts}
      </PreviewCardTrigger>
      <PreviewCardContent
        side="bottom"
        sideOffset={4}
        className={contentClassName}
        onClick={stopTriggerClick}
        onKeyDown={stopClick}
      >
        {breakdown}
      </PreviewCardContent>
    </PreviewCard>
  );
}

export function DiffStat({
  additions,
  deletions,
  diffBreakdown,
}: DiffStatProps) {
  if (
    diffBreakdown !== undefined &&
    Object.values(diffBreakdown).some((totals) => totals.files > 0)
  ) {
    return (
      <SmartDiffStat
        additions={additions}
        deletions={deletions}
        diffBreakdown={diffBreakdown}
      />
    );
  }
  return (
    <span className="shrink-0 tabular-nums">
      <Counts additions={additions} deletions={deletions} />
    </span>
  );
}
