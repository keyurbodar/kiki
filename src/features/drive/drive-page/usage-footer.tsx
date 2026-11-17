// biome-ignore-all lint/a11y: Capy's directory table is an ARIA grid of div subgrid rows (role table/row/cell), class for class from the bundle
import { formatBytes, formatUsedStorage } from "../lib/format";
import type { DriveScopeRow } from "../lib/scopes";

const chartColors = [
  "bg-chart-1",
  "bg-chart-2",
  "bg-chart-3",
  "bg-chart-4",
  "bg-chart-5",
  "bg-chart-6",
  "bg-chart-7",
  "bg-chart-8",
];
const fullColors = [
  "bg-destructive",
  "bg-destructive/60",
  "bg-destructive",
  "bg-destructive/60",
  "bg-destructive/80",
];
const minShare = 0.004;

export interface DriveStorageFacts {
  readonly usedBytes: number;
  readonly limitBytes: number;
}

export interface UsageSegment {
  readonly key: string;
  readonly bytes: number;
}

export const usageSegments = (rows: ReadonlyArray<DriveScopeRow>) =>
  rows.map((row) => ({ key: row.key, bytes: row.summary.totalBytes }));

/**
 * The storage meter under the scope table: one coloured segment per scope
 * that holds at least 0.4% of the limit, then the rest in grey.
 */
export function DriveUsageFooter({
  facts,
  segments,
  activeKey,
  onActiveKey,
  narrow,
}: {
  facts: DriveStorageFacts;
  segments: ReadonlyArray<UsageSegment>;
  activeKey: string | undefined;
  onActiveKey: (key: string | undefined) => void;
  narrow: boolean;
}) {
  const ratio = facts.limitBytes === 0 ? 1 : facts.usedBytes / facts.limitBytes;
  const full = ratio >= 1;
  const near = ratio >= 0.9;
  const scale =
    facts.limitBytes === 0 ? facts.usedBytes || 1 : facts.limitBytes;
  const visible = segments.filter(
    (segment) => segment.bytes / scale >= minShare,
  );
  const hasActive = visible.some((segment) => segment.key === activeKey);
  const shown = visible.reduce((sum, segment) => sum + segment.bytes, 0);
  const shrink = shown > facts.usedBytes ? facts.usedBytes / shown : 1;
  const rest = Math.max(0, facts.usedBytes - shown * shrink);
  const width = (bytes: number) => `${Math.min(100, (bytes / scale) * 100)}%`;
  const label = `${formatUsedStorage(facts.usedBytes, full)} of ${formatBytes(facts.limitBytes)}`;
  return (
    <>
      <div
        role="row"
        className="col-span-full grid grid-cols-subgrid items-center pt-3"
      >
        {!narrow && <div role="cell" className="col-span-2" />}
        <div
          role="cell"
          className="col-span-2 pr-4 text-right text-xs font-normal text-muted-foreground-1 tabular-nums"
        >
          {label}
        </div>
        {!narrow && <div role="cell" />}
      </div>
      <div role="row" className="col-span-full pt-1.5 pb-1">
        <div role="cell" className="col-span-full">
          <div
            role="img"
            aria-label={`${label} used`}
            className="relative flex h-3 w-full items-center overflow-hidden"
            onMouseLeave={() => onActiveKey(undefined)}
          >
            <div className="absolute inset-x-0 h-0.75 rounded-full bg-secondary" />
            {!full && near && (
              <div
                className="absolute right-0 h-0.75 rounded-r-full bg-warning/60"
                style={{ left: width(facts.usedBytes) }}
              />
            )}
            {visible.map((segment, index) => {
              const last = index === visible.length - 1 && rest === 0;
              return (
                <div
                  key={segment.key}
                  data-segment={segment.key}
                  className={[
                    "relative flex h-3 shrink-0 items-center",
                    !last && "pr-0.5",
                    hasActive && activeKey !== segment.key && "opacity-60",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  style={{ width: width(segment.bytes * shrink) }}
                  onMouseEnter={() => onActiveKey(segment.key)}
                >
                  <div
                    className={[
                      "h-0.75 w-full transition-[filter] duration-100",
                      index === 0 && "rounded-l-full",
                      last && "rounded-r-full",
                      full
                        ? fullColors[index % fullColors.length]
                        : (chartColors[index] ?? "bg-chart-other"),
                      activeKey === segment.key && "brightness-125",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  />
                </div>
              );
            })}
            {rest > 0 && (
              <div
                className="relative flex h-3 shrink-0 items-center"
                style={{ width: width(rest) }}
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
