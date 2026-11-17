// biome-ignore-all lint/a11y/useSemanticElements: Capy renders the footer as rows of the drive table's ARIA grid
// biome-ignore-all lint/a11y/useFocusableInteractive: the rows belong to the drive table's ARIA grid
// biome-ignore-all lint/a11y/noStaticElementInteractions: hovering a segment only highlights its legend row
import { cx } from "class-variance-authority";
import type { ReactNode } from "react";
import {
  type DriveUsageFacts,
  type DriveUsageSegment,
  segmentFill,
  usageBar,
} from "./usage-bar";

export interface DriveUsageFooterProps {
  readonly facts: DriveUsageFacts;
  readonly segments: ReadonlyArray<DriveUsageSegment>;
  readonly activeKey: string | undefined;
  readonly onActiveKey: (key: string | undefined) => void;
  readonly narrow: boolean;
  readonly isAdmin: boolean;
  /** Capy's DriveUpgradeButton (link, auto-xs, short), shown to admins near the limit. */
  readonly upgrade?: ReactNode;
}

/** The storage row under the drive table: a used/limit label and a segmented bar. */
export function DriveUsageFooter({
  facts,
  segments,
  activeKey,
  onActiveKey,
  narrow,
  isAdmin,
  upgrade,
}: DriveUsageFooterProps) {
  const bar = usageBar(facts, segments);
  const hasActive = bar.visible.some((segment) => segment.key === activeKey);
  const action = isAdmin && bar.nearlyFull ? upgrade : undefined;
  return (
    <>
      <div
        role="row"
        className="col-span-full grid grid-cols-subgrid items-center pt-3"
      >
        {narrow && <div role="cell">{action}</div>}
        {!narrow && <div role="cell" className="col-span-2" />}
        <div
          role="cell"
          className="col-span-2 pr-4 text-right text-xs font-normal text-muted-foreground-1 tabular-nums"
        >
          {bar.label}
        </div>
        {!narrow && <div role="cell">{action}</div>}
      </div>
      <div role="row" className="col-span-full pt-1.5 pb-1">
        <div role="cell" className="col-span-full">
          <div
            role="img"
            aria-label={`${bar.label} used`}
            className="relative flex h-3 w-full items-center overflow-hidden"
            onMouseLeave={() => onActiveKey(undefined)}
          >
            <div className="absolute inset-x-0 h-0.75 rounded-full bg-secondary" />
            {!bar.full && bar.nearlyFull && (
              <div
                className="absolute right-0 h-0.75 rounded-r-full bg-warning/60"
                style={{ left: bar.width(facts.usedBytes) }}
              />
            )}
            {bar.visible.map((segment, index) => {
              const last =
                index === bar.visible.length - 1 && bar.restBytes === 0;
              return (
                <div
                  key={segment.key}
                  className={cx(
                    "relative flex h-3 shrink-0 items-center",
                    !last && "pr-0.5",
                    hasActive && activeKey !== segment.key && "opacity-60",
                  )}
                  style={{ width: bar.width(segment.bytes * bar.scale) }}
                  onMouseEnter={() => onActiveKey(segment.key)}
                >
                  <div
                    className={cx(
                      "h-0.75 w-full transition-[filter] duration-100",
                      index === 0 && "rounded-l-full",
                      last && "rounded-r-full",
                      segmentFill(index, bar.full),
                      activeKey === segment.key && "brightness-125",
                    )}
                  />
                </div>
              );
            })}
            {bar.restBytes > 0 && (
              <div
                className="relative flex h-3 shrink-0 items-center"
                style={{ width: bar.width(bar.restBytes) }}
              >
                <div className="h-0.75 w-full rounded-r-full bg-muted-foreground-3" />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
