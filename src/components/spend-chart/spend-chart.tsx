import { createContext } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

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
  formatBucket: (start: string) => string;
  formatRange: (start: string) => string;
  className?: string;
};

type SeriesConfig = Record<string, { label: string; color: string }>;

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

const ChartConfigContext = createContext<SeriesConfig>({});

function ChartLegend({ config }: { config: SeriesConfig }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {Object.entries(config).map(([key, item]) => (
        <div key={key} className="flex items-center gap-1.5">
          <span
            className="size-2.5 shrink-0 rounded-(--radius-inner)"
            style={{ background: item.color }}
          />
          <span className="text-2xs text-muted-foreground-1">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
  config,
  formatValue,
  formatLabel,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{
    dataKey?: unknown;
    name?: unknown;
    value?: unknown;
    color?: string;
    fill?: string;
  }>;
  label?: unknown;
  config: SeriesConfig;
  formatValue: (value: number, key: string) => string;
  formatLabel: (value: string) => string;
}) {
  const rows = (payload ?? []).filter((row) => {
    const value = typeof row.value === "number" ? row.value : Number(row.value);
    return Number.isFinite(value) && Math.abs(value) >= 5;
  });
  if (!active || rows.length === 0) return null;
  return (
    <div className="min-w-32 rounded-(--radius-overlay) border-border-1 border-border-2 bg-popover px-2.5 py-2 shadow-overlay">
      {label !== undefined && (
        <div className="wrap-anywhere pb-1.5 text-2xs font-medium text-foreground">
          {formatLabel(String(label))}
        </div>
      )}
      <div className="flex flex-col gap-1">
        {rows.map((row) => {
          const key = String(row.dataKey ?? row.name ?? "");
          const value =
            typeof row.value === "number" ? row.value : Number(row.value);
          return (
            <div key={key} className="flex items-center gap-2">
              <span
                className="size-2.5 shrink-0 rounded-(--radius-inner)"
                style={{ background: row.color ?? row.fill }}
              />
              <span className="flex-1 text-2xs text-muted-foreground-1">
                {config[key]?.label ?? String(row.name ?? key)}
              </span>
              <span className="text-2xs font-medium text-foreground tabular-nums">
                {formatValue(value, key)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function SpendChart({
  series,
  formatValue,
  formatBucket,
  formatRange,
  className,
}: SpendChartProps) {
  const keySet = Array.from(
    new Set(
      series.buckets.flatMap((bucket) =>
        bucket.slices.map((slice) => slice.key),
      ),
    ),
  );
  const shardKeys = keySet.slice(0, 8);
  const restKeys = new Set(keySet.slice(8));
  const config: SeriesConfig = {
    ...Object.fromEntries(
      shardKeys.map((key) => [
        key,
        {
          label: SERIES_LABELS[key] ?? key,
          color: SERIES_COLORS[key] ?? "var(--chart-other)",
        },
      ]),
    ),
    ...(restKeys.size > 0
      ? { other: { label: "Other", color: "var(--chart-other)" } }
      : {}),
  };
  const keys = Object.keys(config);
  const rows = series.buckets.map((bucket) => {
    const row: Record<string, string | number> = { start: bucket.start };
    for (const slice of bucket.slices) {
      const key = restKeys.has(slice.key) ? "other" : slice.key;
      row[key] = ((row[key] as number) ?? 0) + slice.credits;
    }
    return row;
  });

  return (
    <ChartConfigContext value={config}>
      <ChartConfigContext.Consumer>
        {(chartConfig) => (
          <div className="flex flex-col gap-3">
            <div className={className ?? "h-52"}>
              <ResponsiveContainer width="100%" height="100%">
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
                    tickFormatter={(value: number) => formatValue(value, "")}
                  />
                  <Tooltip
                    cursor={false}
                    content={(props) => (
                      <ChartTooltip
                        active={props.active}
                        payload={props.payload as never}
                        label={props.label}
                        config={chartConfig}
                        formatValue={formatValue}
                        formatLabel={formatRange}
                      />
                    )}
                  />
                  {keys.map((key, index) => (
                    <Bar
                      key={key}
                      dataKey={key}
                      stackId="spend"
                      fill={chartConfig[key]?.color}
                      stroke="var(--card)"
                      strokeWidth={1}
                      isAnimationActive={false}
                      radius={index === keys.length - 1 ? [2, 2, 0, 0] : 0}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
            <ChartLegend config={chartConfig} />
          </div>
        )}
      </ChartConfigContext.Consumer>
    </ChartConfigContext>
  );
}
