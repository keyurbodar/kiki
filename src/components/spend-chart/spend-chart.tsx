import type { ComponentProps } from "react";

export type SpendChartSeries = {
  bucket: "hour" | "day";
  keys: ReadonlyArray<{ key: string; label: string }>;
  buckets: ReadonlyArray<{
    start: string;
    end: string;
    slices: ReadonlyArray<{ key: string; credits: number }>;
    includedCredits?: number;
  }>;
};

export type SpendChartProps = Omit<ComponentProps<"div">, "children"> & {
  series: SpendChartSeries;
  formatValue: (value: number) => string;
  formatBucket: (start: string) => string;
};

const SERIES_COLORS: Record<string, string> = {
  paid: "var(--chart-1)",
  byok: "var(--chart-2)",
  subscription: "var(--chart-3)",
  allowance: "var(--chart-4)",
  internal: "var(--chart-5)",
  no_charge: "var(--chart-other)",
  included: "var(--chart-6)",
  token_fee: "var(--chart-other)",
  other: "var(--chart-other)",
};

const SERIES_LABELS: Record<string, string> = {
  paid: "Billed",
  byok: "BYOK",
  subscription: "Subscription",
  allowance: "OSS allowance",
  internal: "Internal",
  no_charge: "No charge",
  included: "Covered by plan",
  token_fee: "Token fee",
  other: "Other",
};

export function SpendChart({
  series,
  formatValue,
  formatBucket,
  ...props
}: SpendChartProps) {
  const keys = Array.from(
    new Set(
      series.buckets.flatMap((bucket) =>
        bucket.slices.map((slice) => slice.key),
      ),
    ),
  ).slice(0, 8);
  const totals = series.buckets.map((bucket) =>
    bucket.slices.reduce((sum, slice) => sum + slice.credits, 0),
  );
  const max = Math.max(1, ...totals);
  const gridlines = [0.25, 0.5, 0.75, 1];

  return (
    <div data-slot="spend-chart" {...props}>
      <div className="flex gap-2">
        <div className="flex flex-col-reverse justify-start gap-0 pt-0.5 pb-6 text-2xs tabular-nums text-muted-foreground-2">
          {[0, 0.25, 0.5, 0.75, 1].map((fraction) => (
            <span key={fraction} className="flex-1">
              {formatValue(max * fraction)}
            </span>
          ))}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="relative flex h-52 items-end border-b border-border-1">
            {gridlines.map((fraction) => (
              <span
                key={fraction}
                aria-hidden
                className="absolute inset-x-0 border-t border-border-1"
                style={{ bottom: `${fraction * 100}%` }}
              />
            ))}
            {series.buckets.map((bucket, index) => (
              <div
                key={bucket.start}
                className="relative z-1 flex h-full min-w-0 flex-1 flex-col-reverse"
                title={`${formatBucket(bucket.start)}: ${formatValue(totals[index] ?? 0)}`}
              >
                {keys.map((key) => {
                  const credits =
                    bucket.slices.find((slice) => slice.key === key)?.credits ??
                    0;
                  if (credits <= 0) return null;
                  return (
                    <span
                      key={key}
                      className="w-full shrink-0"
                      style={{
                        height: `${(credits / max) * 100}%`,
                        background: SERIES_COLORS[key] ?? "var(--chart-other)",
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
          <div className="flex text-2xs text-muted-foreground-2">
            {series.buckets.map((bucket) => (
              <span
                key={bucket.start}
                className="min-w-0 flex-1 truncate text-center"
              >
                {formatBucket(bucket.start)}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
        {keys.map((key) => (
          <div key={key} className="flex items-center gap-1.5">
            <span
              className="size-2.5 shrink-0 rounded-(--radius-inner)"
              style={{ background: SERIES_COLORS[key] ?? "var(--chart-other)" }}
            />
            <span className="text-2xs text-muted-foreground-1">
              {SERIES_LABELS[key] ?? key}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
