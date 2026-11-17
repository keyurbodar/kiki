import { SpendChart } from "@/components/spend-chart";
import { Button } from "@/primitives/button";
import { Card } from "@/primitives/card";
import { SkeletonPanel } from "@/primitives/skeleton-panel";
import {
  formatAxisCredits,
  formatBucketLabel,
  formatCredits,
  formatRangeLabel,
  seriesWindow,
  type UsageQuery,
} from "./model";
import type { UsageRange, UsageSeries } from "./types";

const DIMENSIONS: ReadonlyArray<{
  id: NonNullable<UsageQuery["dim"]>;
  label: string;
}> = [
  { id: "routes", label: "Total" },
  { id: "models", label: "Models" },
  { id: "members", label: "Members" },
  { id: "private", label: "Private work" },
];

const totalOf = (series: UsageSeries) =>
  series.buckets.reduce(
    (sum, bucket) =>
      sum + bucket.slices.reduce((inner, slice) => inner + slice.credits, 0),
    0,
  );

export function UsageChartSection({
  series,
  range,
  dimension,
  onDimension,
}: {
  series: UsageSeries | undefined;
  range: UsageRange;
  dimension: NonNullable<UsageQuery["dim"]>;
  onDimension: (dim: NonNullable<UsageQuery["dim"]>) => void;
}) {
  const window = series === undefined ? undefined : seriesWindow(series);
  const from = window?.from ?? range.from;
  const to = window?.to ?? range.to;

  return (
    <Card className="flex-col gap-3 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-medium text-foreground tabular-nums">
            {series === undefined ? "—" : formatCredits(totalOf(series))}
          </span>
          <span className="text-xs font-normal text-muted-foreground-2">
            total spend, {formatRangeLabel(from, to, range.timeZone)}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {DIMENSIONS.map((item) => (
            <Button
              key={item.id}
              data-track-owner="shared/spend-chart.tsx#SpendChartCard:Button.1"
              size="xs"
              variant="ghost"
              data-selected={dimension === item.id ? "" : undefined}
              onClick={() => onDimension(item.id)}
            >
              {item.label}
            </Button>
          ))}
        </div>
      </div>
      {series === undefined ? (
        <div className="flex flex-col gap-3">
          <SkeletonPanel className="h-6 w-48" />
          <SkeletonPanel className="h-52 w-full" />
        </div>
      ) : series.buckets.length === 0 ? (
        <div className="flex h-52 items-center justify-center text-sm font-normal text-muted-foreground-2">
          No usage in selected period
        </div>
      ) : (
        <SpendChart
          className="h-52"
          series={series}
          formatValue={formatCredits}
          formatAxis={formatAxisCredits}
          formatBucket={(start) =>
            formatBucketLabel(new Date(start), series.bucket, range.timeZone)
          }
          formatRange={(start) =>
            formatBucketLabel(new Date(start), series.bucket, range.timeZone)
          }
        />
      )}
    </Card>
  );
}
