import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
import {
  Chart,
  type ChartConfig,
  ChartLegend,
  ChartTooltipContent,
  chartSeriesColor,
} from "@/primitives/chart";

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

export type SpendChartProps = {
  series: SpendChartSeries;
  formatValue: (value: number) => string;
  formatAxis?: (value: number) => string;
  formatBucket: (start: string) => string;
  formatRange: (start: string) => string;
  className?: string;
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

const SERIES_ORDER = [
  "paid",
  "byok",
  "subscription",
  "allowance",
  "internal",
  "no_charge",
  "included",
  "token_fee",
];

const seriesKeys = (series: SpendChartSeries) => {
  const present = new Set(
    series.buckets.flatMap((bucket) => bucket.slices.map((slice) => slice.key)),
  );
  const declared = series.keys
    .map((entry) => entry.key)
    .filter((key) => key !== "");
  const ordered = [...new Set([...declared, ...present])].sort((a, b) => {
    const left = SERIES_ORDER.indexOf(a);
    const right = SERIES_ORDER.indexOf(b);
    return (
      (left === -1 ? SERIES_ORDER.length : left) -
      (right === -1 ? SERIES_ORDER.length : right)
    );
  });
  return ordered.slice(0, 8);
};

export function SpendChart({
  series,
  formatValue,
  formatAxis,
  formatBucket,
  formatRange,
  className,
}: SpendChartProps) {
  const keys = seriesKeys(series);
  const labels = new Map(series.keys.map((entry) => [entry.key, entry.label]));
  const config: ChartConfig = Object.fromEntries(
    keys.map((key) => [
      key,
      {
        label: labels.get(key) ?? SERIES_LABELS[key] ?? key,
        color: SERIES_COLORS[key] ?? "var(--chart-other)",
      },
    ]),
  );
  const rows = series.buckets.map((bucket) => {
    const row: Record<string, string | number> = { start: bucket.start };
    for (const slice of bucket.slices) {
      if (!keys.includes(slice.key)) continue;
      row[slice.key] =
        ((row[slice.key] as number | undefined) ?? 0) + slice.credits;
    }
    return row;
  });

  return (
    <div className="flex flex-col gap-3">
      <Chart config={config} className={className ?? "h-52"}>
        <BarChart
          accessibilityLayer={false}
          data={rows}
          margin={{ top: 4, right: 0, bottom: 0, left: 0 }}
        >
          <CartesianGrid vertical={false} strokeWidth={0.5} />
          <XAxis
            dataKey="start"
            tickLine={false}
            axisLine={false}
            dy={4}
            tickFormatter={(value: string) => formatBucket(value)}
            interval="preserveStartEnd"
            minTickGap={24}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={52}
            tickFormatter={(value: number) =>
              formatAxis === undefined ? formatValue(value) : formatAxis(value)
            }
          />
          <Tooltip
            cursor={false}
            content={(props) => (
              <ChartTooltipContent
                active={props.active}
                payload={props.payload}
                label={props.label}
                minValue={5}
                total={chartTotal(props.payload)}
                labelFormatter={(value) => formatRange(String(value))}
                valueFormatter={(value) => formatValue(value)}
                totalFormatter={(value) => formatValue(value)}
              />
            )}
          />
          {keys.map((key, index) => (
            <Bar
              key={key}
              dataKey={key}
              stackId="spend"
              fill={chartSeriesColor(key)}
              stroke="var(--card)"
              strokeWidth={1}
              isAnimationActive={false}
              radius={index === keys.length - 1 ? [2, 2, 0, 0] : 0}
            />
          ))}
        </BarChart>
      </Chart>
      <ChartLegend config={config} />
    </div>
  );
}

const chartTotal = (
  payload:
    | ReadonlyArray<{ value?: unknown; dataKey?: unknown; name?: unknown }>
    | undefined,
) =>
  (payload ?? []).reduce((sum, entry) => {
    const value =
      typeof entry.value === "number" ? entry.value : Number(entry.value);
    return Number.isFinite(value) ? sum + value : sum;
  }, 0);
