import { cx } from "class-variance-authority";
import { type ReactNode, useState } from "react";
import { Button } from "@/primitives/button";
import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "@/primitives/collapsible";
import { Icon } from "@/primitives/icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";

/** Rows a section shows before "Show N more". */
export const overviewSectionLimit = 10;

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
export const overviewRowMuted =
  "text-foreground/80 dark:text-muted-foreground-1";
export const overviewEmptyMark = "opacity-30 grayscale mix-blend-luminosity";

const footerButton =
  "flex min-h-7 cursor-pointer items-center rounded-(--radius) px-2 text-2xs text-muted-foreground-2 hover:text-foreground focus-visible:outline-ring-inset";

export type OverviewSectionMore = {
  loading: boolean;
  retry: boolean;
  onLoad: () => void;
};

export type OverviewSectionProps = {
  jamId: string;
  sectionId: string;
  label: string;
  count?: string;
  rows: ReactNode[];
  open?: { label: string; onOpen: () => void };
  action?: ReactNode;
  more?: OverviewSectionMore;
};

/** How many rows a section hides behind "Show N more". */
export const hiddenRowCount = (rows: number, expanded: boolean) =>
  expanded ? 0 : Math.max(0, rows - overviewSectionLimit);

/**
 * One collapsible block of the overview pane (Capy's shared/overview-section
 * Section): a header with label and count, then up to ten rows.
 */
export function OverviewSection({
  sectionId,
  label,
  count,
  rows,
  open,
  action,
  more,
}: OverviewSectionProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const hidden = hiddenRowCount(rows.length, expanded);

  return (
    <Collapsible
      data-section={sectionId}
      open={!collapsed}
      onOpenChange={(next) => setCollapsed(!next)}
    >
      <div className="flex h-7 w-full items-center rounded-(--radius) bg-section">
        <CollapsibleTrigger className="group/section flex h-full flex-1 cursor-pointer items-center gap-1.5 px-2 text-left text-xs font-medium outline-none focus-visible:outline-ring-inset">
          <span className="text-foreground">{label}</span>
          {count !== undefined && (
            <span className="font-normal text-muted-foreground-3 tabular-nums">
              {count}
            </span>
          )}
          <Icon
            name="chevron-right"
            className="size-(--icon-xs) text-muted-foreground-3 transition-transform duration-100 group-data-[panel-open]/section:rotate-90"
          />
        </CollapsibleTrigger>
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
                  <Icon name="arrow-corner-up-right" size="sm" />
                </Button>
              }
            />
            <TooltipContent side="bottom">{open.label}</TooltipContent>
          </Tooltip>
        )}
        {action}
      </div>
      <CollapsiblePanel>
        <div className="flex flex-col pt-0.5">
          {rows.slice(0, rows.length - hidden)}
          {hidden === 0 && more !== undefined && (
            <button
              type="button"
              disabled={more.loading}
              onClick={more.onLoad}
              className={cx(
                footerButton,
                "disabled:cursor-default disabled:hover:text-muted-foreground-2",
              )}
            >
              {more.loading ? "Loading…" : more.retry ? "Retry" : "Show more"}
            </button>
          )}
          {(hidden > 0 || (expanded && rows.length > overviewSectionLimit)) && (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className={footerButton}
            >
              {expanded ? "Show less" : `Show ${hidden} more`}
            </button>
          )}
        </div>
      </CollapsiblePanel>
    </Collapsible>
  );
}

/** The centred empty layout of the overview pane: a mark above surface rows. */
export function OverviewEmpty({
  mark,
  children,
}: {
  mark: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 p-6">
      {mark}
      <div className="flex w-full max-w-80 flex-col gap-2">{children}</div>
    </div>
  );
}

/** One card row of the empty overview: icon, label, detail and value. */
export function OverviewSurfaceRow({
  icon,
  label,
  value,
  detail,
  onOpen,
}: {
  icon: ReactNode;
  label: string;
  value?: string | false;
  detail?: string;
  onOpen?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex h-12 w-full cursor-pointer flex-row items-center gap-3 rounded-(--radius-card) border-(length:--border-width-hairline) border-border-2 bg-card px-3 text-left outline-none transition-colors duration-100 hover:bg-secondary focus-visible:outline-ring-inset"
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
      <Icon
        name="chevron-right"
        className="size-(--icon-sm) shrink-0 text-muted-foreground-3"
      />
    </button>
  );
}
