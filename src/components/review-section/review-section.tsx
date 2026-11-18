import { type ReactNode, useCallback, useState } from "react";
import {
  BubbleGlyph,
  ChevronDownSmallGlyph,
  ChevronRightSmallGlyph,
  CopyGlyph,
  cx,
  MenuRowContent,
  type ReviewTier,
  reviewTierCopy,
  reviewTiers,
} from "@/components/review-mode";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import {
  ResponsiveMenu,
  ResponsiveMenuContent,
  ResponsiveMenuItem,
  ResponsiveMenuTrigger,
} from "@/primitives/responsive-menu";
import { ScrollArea, ScrollAreaViewport } from "@/primitives/scroll-area";
import { ShimmerText } from "@/primitives/shimmer-text";
import { toast } from "@/primitives/toaster";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";
import {
  type CapyReview,
  countsLabel,
  defaultTierLabel,
  findingsAsText,
  isPullClosed,
  isRoundActive,
  partitionFindings,
  type ReviewFinding,
  type ReviewPull,
  type ReviewRound,
  reviewedHead,
  reviewStatus,
  runLabel,
} from "./model";

export type RunReviewInput = {
  readonly forceRefresh: boolean;
  readonly tier: ReviewTier | undefined;
};

export type ReviewSectionProps = {
  readonly pull: ReviewPull;
  /** `undefined` while the review is loading, `null` when the pull has none. */
  readonly review: CapyReview | null | undefined;
  /** Without an org the run control is disabled. */
  readonly orgId?: string;
  /** The org's effective review tier, shown under the run control. */
  readonly effectiveTier?: ReviewTier | null;
  readonly collapsible?: boolean;
  readonly onRun: (input: RunReviewInput) => Promise<unknown>;
  readonly onOpenFinding?: (finding: ReviewFinding) => void;
  /** Finding rows come from the finding-card package; a plain row renders until then. */
  readonly renderFinding?: (finding: ReviewFinding) => ReactNode;
  /** The review thread's chat, drawn when the reviewer is live or the chat toggle is on. */
  readonly renderChat?: (review: CapyReview, alive: boolean) => ReactNode;
};

const chatDefaultHeight = 288;
const chatMinHeight = 160;

export function ReviewSection({
  pull,
  review,
  orgId,
  effectiveTier,
  collapsible = true,
  onRun,
  onOpenFinding,
  renderFinding,
  renderChat,
}: ReviewSectionProps) {
  const [starting, setStarting] = useState(false);
  const [open, setOpen] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [chatOverride, setChatOverride] = useState<boolean | null>(null);
  const [measured, setMeasured] = useState<number | null>(null);

  const loaded = review !== undefined;
  const value = review ?? null;
  const rounds = value?.rounds ?? [];
  const latest = rounds.at(-1);
  const running = starting || isRoundActive(latest);
  const completed = reviewedHead(value, pull.headSha);
  const findings = partitionFindings(value?.findings ?? [], expanded);
  const showChat =
    value !== null && rounds.length > 0 && (chatOverride ?? running);
  const counts = countsLabel(findings.open.length, findings.resolved.length);

  const run = (tier?: ReviewTier) => {
    if (orgId === undefined || running) return;
    setStarting(true);
    onRun({ forceRefresh: completed, tier })
      .catch((error: unknown) => {
        toast.error("Review refused", { description: String(error) });
      })
      .finally(() => setStarting(false));
  };

  const measure = useCallback(
    (node: HTMLDivElement | null) => {
      if (node === null || !open) return;
      const observer = new ResizeObserver(([entry]) => {
        const height = entry?.borderBoxSize[0]?.blockSize;
        if (height !== undefined) setMeasured(height);
      });
      observer.observe(node);
      return () => observer.disconnect();
    },
    [open],
  );

  return (
    <div
      data-pull-section="review"
      className="flex min-h-0 scroll-mt-3 flex-col gap-2"
    >
      <div className="flex min-w-0 items-center gap-1">
        {collapsible ? (
          <Button
            data-track-owner="shared/pull-view/review-section.tsx#ReviewSection:Button.1"
            variant="ghost"
            size="xs"
            className="-ml-2"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            <span className="text-muted-foreground-2">Capy Review</span>
            {open ? (
              <ChevronDownSmallGlyph className="text-icon-muted" />
            ) : (
              <ChevronRightSmallGlyph className="text-icon-muted" />
            )}
          </Button>
        ) : (
          <span className="text-xs font-medium text-muted-foreground-2">
            Capy Review
          </span>
        )}
        <span className="min-w-0 flex-1" />
        {!open && counts !== "" && (
          <span className="min-w-0 truncate text-xs text-muted-foreground-3">
            {counts}
          </span>
        )}
        {open && value !== null && rounds.length > 0 && findings.copyable && (
          <Button
            data-track-owner="shared/pull-view/review-section.tsx#ReviewSection:Button[Copy all]"
            variant="ghost"
            size="xs"
            onClick={() => {
              void navigator.clipboard?.writeText(
                findingsAsText(findings.open),
              );
            }}
          >
            <CopyGlyph />
            Copy all
          </Button>
        )}
        {open && value !== null && rounds.length > 0 && (
          <Tooltip>
            <TooltipTrigger
              data-track-owner="shared/pull-view/review-section.tsx#ReviewSection:TooltipTrigger.1"
              render={
                <Button
                  data-track-owner="shared/pull-view/review-section.tsx#ReviewSection:Button.2"
                  variant="ghost"
                  size="icon-xs"
                  aria-label={showChat ? "Show findings" : "View review chat"}
                  aria-pressed={showChat}
                  onClick={() => setChatOverride(!showChat)}
                >
                  <BubbleGlyph />
                </Button>
              }
            />
            <TooltipContent side="top">
              {showChat ? "Show findings" : "View review chat"}
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      <div
        inert={!open}
        className={cx(
          "-mt-2 grid min-h-0 transition-[grid-template-rows,opacity] duration-base ease-out-quint motion-reduce:transition-none",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="flex min-h-0 flex-col overflow-hidden pt-2">
          {value !== null && showChat ? (
            <div
              className="flex flex-col overflow-hidden rounded-(--radius-card) border-hairline border-border-1 bg-card"
              style={{
                height: Math.max(measured ?? chatDefaultHeight, chatMinHeight),
              }}
            >
              {renderChat?.(value, running)}
            </div>
          ) : (
            <div ref={measure} className="flex min-h-0 flex-col gap-2">
              <ReviewStatusLine
                running={running}
                latest={latest}
                openCount={findings.open.length}
                resolvedCount={findings.resolved.length}
              />
              {findings.shown.length > 0 && (
                <ScrollArea className="-ml-2 min-h-0">
                  <ScrollAreaViewport>
                    <div className="flex flex-col">
                      {findings.shown.map((finding) =>
                        renderFinding ? (
                          <div key={finding.id}>{renderFinding(finding)}</div>
                        ) : (
                          <FindingRow
                            key={finding.id}
                            finding={finding}
                            onOpen={onOpenFinding}
                          />
                        ),
                      )}
                    </div>
                  </ScrollAreaViewport>
                </ScrollArea>
              )}
              {findings.hidden > 0 && (
                <Button
                  data-track-owner="shared/pull-view/review-section.tsx#ReviewSection:Button.3"
                  variant="ghost"
                  size="xs"
                  className="-ml-2 w-fit shrink-0"
                  onClick={() => setExpanded((current) => !current)}
                >
                  <span className="text-muted-foreground-2">
                    {expanded ? "Show fewer" : `Show ${findings.hidden} more`}
                  </span>
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
      {!isPullClosed(pull) && (
        <ReviewRunControl
          running={running}
          completed={completed}
          disabled={orgId === undefined}
          defaultTier={
            completed || (loaded && value?.reviewedHeadSha == null)
              ? effectiveTier
              : undefined
          }
          onRun={run}
        />
      )}
    </div>
  );
}

function FindingRow({
  finding,
  onOpen,
}: {
  readonly finding: ReviewFinding;
  readonly onOpen?: (finding: ReviewFinding) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen?.(finding)}
      className="flex min-w-0 cursor-pointer flex-col gap-0.5 rounded px-2 py-1.5 text-left outline-none transition-colors duration-100 hover:bg-secondary focus-visible:outline-ring-inset"
    >
      <span
        className={cx(
          "truncate text-sm",
          finding.kind === "note"
            ? "text-muted-foreground-2"
            : finding.severity === "high"
              ? "text-destructive"
              : finding.severity === "medium"
                ? "text-warning-fg"
                : "text-foreground",
        )}
      >
        {finding.title}
      </span>
      {finding.path !== null && (
        <span className="truncate text-xs text-muted-foreground-2">
          {finding.path}
          {finding.line === null ? "" : `:${finding.line}`}
        </span>
      )}
    </button>
  );
}

export type ReviewStatusLineProps = {
  readonly running: boolean;
  readonly latest: ReviewRound | undefined;
  readonly openCount: number;
  readonly resolvedCount: number;
};

export function ReviewStatusLine({
  running,
  latest,
  openCount,
  resolvedCount,
}: ReviewStatusLineProps) {
  const status = reviewStatus(running, latest, openCount, resolvedCount);
  switch (status.kind) {
    case "running":
      return <ShimmerText className="text-sm">{status.text}</ShimmerText>;
    case "idle":
      return (
        <span className="text-sm text-muted-foreground-2">{status.text}</span>
      );
    case "failed":
      return (
        <span className="text-sm text-muted-foreground-1">{status.text}</span>
      );
    case "complete":
      return (
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="text-sm text-balance text-foreground">
            {status.text}
          </span>
          {status.meta !== "" && (
            <span className="text-2xs text-muted-foreground-3">
              {status.meta}
            </span>
          )}
        </span>
      );
  }
}

export type ReviewRunControlProps = {
  readonly running: boolean;
  readonly completed: boolean;
  readonly disabled: boolean;
  readonly defaultTier: ReviewTier | null | undefined;
  readonly onRun: (tier?: ReviewTier) => void;
};

export function ReviewRunControl({
  running,
  completed,
  disabled,
  defaultTier,
  onRun,
}: ReviewRunControlProps) {
  return (
    <div className="mt-1 flex flex-col gap-1.5">
      <div className="flex items-center rounded-(--radius) shadow-plate">
        <Button
          data-track-owner="shared/pull-view/review-section.tsx#ReviewRunControl:Button.1"
          size="sm"
          shape="segment-start"
          className="min-w-0 flex-1"
          aria-busy={running || undefined}
          data-loading={running || undefined}
          disabled={disabled || running}
          onClick={() => onRun()}
        >
          <span
            data-slot="button-icon"
            className="inline-flex shrink-0 items-center justify-center -ml-0.5"
          >
            <Icon name="review" className="size-4" />
          </span>
          {runLabel(running, completed)}
        </Button>
        <ResponsiveMenu>
          <ResponsiveMenuTrigger
            data-track-owner="shared/pull-view/review-section.tsx#ReviewRunControl:ResponsiveMenuTrigger.1"
            render={
              <Button
                data-track-owner="shared/pull-view/review-section.tsx#ReviewRunControl:Button[Choose review tier]"
                size="icon-sm"
                shape="segment-end"
                disabled={disabled || running}
                aria-label="Choose review tier"
              >
                <ChevronDownSmallGlyph />
              </Button>
            }
          />
          <ResponsiveMenuContent align="end" className="w-80">
            {reviewTiers.map((tier) => (
              <ResponsiveMenuItem
                key={tier}
                data-track-owner="shared/pull-view/review-section.tsx#ReviewRunControl:ResponsiveMenuItem.1"
                data-density="rich"
                onClick={() => onRun(tier)}
              >
                <MenuRowContent
                  density="rich"
                  label={reviewTierCopy[tier].label}
                  description={reviewTierCopy[tier].description}
                />
              </ResponsiveMenuItem>
            ))}
          </ResponsiveMenuContent>
        </ResponsiveMenu>
      </div>
      <span className="text-center text-xs text-muted-foreground-2">
        {defaultTierLabel(defaultTier)}
      </span>
    </div>
  );
}
