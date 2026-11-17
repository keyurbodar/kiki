import { useAtom } from "@effect/atom-react";
import { cx } from "class-variance-authority";
import type { ReactNode } from "react";
import { Button } from "@/primitives/button";
import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "@/primitives/collapsible";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";
import {
  hiddenRowCount,
  moreLabel,
  OVERVIEW_SECTION_LIMIT,
  type OverviewSectionId,
  overviewCollapsedSectionsAtom,
  overviewExpandedSectionsAtom,
  type SectionMore,
  toggleSection,
  visibleRows,
} from "./state";

export const overviewRow =
  "flex w-full flex-col gap-0.5 rounded-(--radius) px-2 py-1.5 text-left text-sm";
export const overviewRowInteractive =
  "cursor-pointer transition-colors duration-100 hover:bg-secondary focus-visible:outline-ring-inset";
export const overviewRowLine = "flex min-w-0 items-center gap-2";
export const overviewRowIcon =
  "flex size-4 shrink-0 items-center justify-center";
export const overviewRowMeta =
  "flex min-w-0 items-center gap-1.5 pl-6 text-xs text-muted-foreground-2";
export const overviewRowTitle =
  "mask-fade-r min-w-0 flex-1 overflow-hidden whitespace-nowrap";
export const overviewMarkDim = "opacity-30 grayscale mix-blend-luminosity";

const sectionButton =
  "flex min-h-7 cursor-pointer items-center rounded-(--radius) px-2 text-2xs text-muted-foreground-2 hover:text-foreground focus-visible:outline-ring-inset";

export type SectionHeaderProps = {
  label: ReactNode;
  count?: ReactNode;
  children?: ReactNode;
};

export function SectionHeader({ label, count, children }: SectionHeaderProps) {
  return (
    <div
      data-slot="overview-section-header"
      className="flex h-7 w-full items-center rounded-(--radius) bg-section"
    >
      <CollapsibleTrigger block className="h-full flex-1 px-2 text-xs">
        <span className="text-foreground">{label}</span>
        {count !== undefined && (
          <span className="font-normal text-muted-foreground-3 tabular-nums">
            {count}
          </span>
        )}
      </CollapsibleTrigger>
      {children}
    </div>
  );
}

export type OverviewSectionOpen = { label: string; onOpen: () => void };

export type OverviewSectionProps = {
  jamId: string;
  sectionId: OverviewSectionId;
  label: ReactNode;
  count?: ReactNode;
  rows: ReadonlyArray<ReactNode>;
  open?: OverviewSectionOpen;
  action?: ReactNode;
  more?: SectionMore;
};

export function OverviewSection({
  jamId,
  sectionId,
  label,
  count,
  rows,
  open,
  action,
  more,
}: OverviewSectionProps) {
  const [collapsed, setCollapsed] = useAtom(
    overviewCollapsedSectionsAtom(jamId),
  );
  const [expandedIds, setExpanded] = useAtom(
    overviewExpandedSectionsAtom(jamId),
  );
  const expanded = expandedIds.includes(sectionId);
  const hidden = hiddenRowCount(rows.length, expanded);
  return (
    <Collapsible
      data-slot="overview-section"
      data-section={sectionId}
      open={!collapsed.includes(sectionId)}
      onOpenChange={(next) =>
        setCollapsed(toggleSection(collapsed, sectionId, !next))
      }
    >
      <SectionHeader label={label} count={count}>
        {open !== undefined && (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="bare"
                  size="icon-shrink"
                  aria-label={open.label}
                  className="mr-1 p-1"
                  onClick={open.onOpen}
                >
                  <ArrowUpRightGlyph />
                </Button>
              }
            />
            <TooltipContent side="bottom">{open.label}</TooltipContent>
          </Tooltip>
        )}
        {action}
      </SectionHeader>
      <CollapsiblePanel>
        <div className="flex flex-col pt-0.5">
          {visibleRows(rows, expanded)}
          {hidden === 0 && more !== undefined && (
            <button
              type="button"
              disabled={more.loading}
              onClick={more.onLoad}
              className={cx(
                sectionButton,
                "disabled:cursor-default disabled:hover:text-muted-foreground-2",
              )}
            >
              {moreLabel(more)}
            </button>
          )}
          {(hidden > 0 ||
            (expanded && rows.length > OVERVIEW_SECTION_LIMIT)) && (
            <button
              type="button"
              onClick={() =>
                setExpanded(toggleSection(expandedIds, sectionId, !expanded))
              }
              className={sectionButton}
            >
              {expanded ? "Show less" : `Show ${hidden} more`}
            </button>
          )}
        </div>
      </CollapsiblePanel>
    </Collapsible>
  );
}

export type SurfaceStackProps = { mark: ReactNode; children: ReactNode };

export function SurfaceStack({ mark, children }: SurfaceStackProps) {
  return (
    <div
      data-slot="overview-surface-stack"
      className="flex flex-1 flex-col items-center justify-center gap-8 p-6"
    >
      {mark}
      <div className="flex w-full max-w-80 flex-col gap-2">{children}</div>
    </div>
  );
}

const surfaceCard =
  "flex flex-col overflow-clip bg-card rounded-(--radius-card) border-hairline border-(--card-hairline) shadow-card cursor-pointer select-none transition-colors duration-100 hover:bg-card-hover focus-visible:outline-ring-inset";

export type SurfaceRowProps = {
  icon: ReactNode;
  label: ReactNode;
  value?: ReactNode;
  detail?: ReactNode;
  onOpen?: () => void;
};

export function SurfaceRow({
  icon,
  label,
  value,
  detail,
  onOpen,
}: SurfaceRowProps) {
  return (
    <button
      type="button"
      data-slot="overview-surface-row"
      onClick={onOpen}
      className={cx(
        surfaceCard,
        "h-12 flex-row items-center gap-3 px-3 text-left",
      )}
    >
      <span className="grid size-7 shrink-0 place-items-center rounded-md bg-secondary text-foreground [&_svg]:size-(--icon-sm)">
        {icon}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium text-foreground">
          {label}
        </span>
        {detail !== undefined && (
          <span className="truncate text-2xs text-muted-foreground-2">
            {detail}
          </span>
        )}
      </span>
      {value !== undefined && value !== false && (
        <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground-1 tabular-nums">
          {value}
        </span>
      )}
      <ChevronRightSmallGlyph className="size-(--icon-sm) shrink-0 text-muted-foreground-3" />
    </button>
  );
}

function ArrowUpRightGlyph() {
  return (
    <svg aria-hidden data-icon="arrow-up-right" viewBox="0 0 24 24" fill="none">
      <path
        d="M18 15V6M18 6H9M18 6L6.25 17.75"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronRightSmallGlyph({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      data-icon="chevron-right-small"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      <path
        d="M10 16L12.9393 13.0607C13.5251 12.4749 13.5251 11.5251 12.9393 10.9393L10 8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
