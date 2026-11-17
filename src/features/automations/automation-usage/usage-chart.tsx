import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Chart,
  type ChartConfig,
  ChartLegend,
  ChartTooltipContent,
  chartSeriesColor,
} from "@/primitives/chart";
import { formatDay, formatSpend, type UsagePoint } from "./usage";

const config: ChartConfig = {
  credits: { label: "Spend", color: "var(--chart-1)" },
  runs: { label: "Runs", color: "var(--chart-2)" },
};

const total = (
  payload:
    | ReadonlyArray<{ value?: unknown; dataKey?: unknown; name?: unknown }>
    | undefined,
) =>
  (payload ?? []).reduce((sum, entry) => {
    const value =
      typeof entry.value === "number" ? entry.value : Number(entry.value);
    return Number.isFinite(value) ? sum + value : sum;
  }, 0);

/** Spend per day as bars, runs per day as a line on their own axis. */
export function UsageChart({
  points,
  className = "h-44",
}: {
  points: ReadonlyArray<UsagePoint>;
  className?: string;
}) {
  const rows = points.map((point) => ({
    start: point.start,
    credits: point.credits,
    runs: point.runs,
  }));
  return (
    <div className="flex flex-col gap-3">
      <Chart config={config} className={className}>
        <ComposedChart
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
            tickFormatter={(value: string) => formatDay(value)}
            interval="preserveStartEnd"
            minTickGap={24}
          />
          <YAxis
            yAxisId="spend"
            tickLine={false}
            axisLine={false}
            width={52}
            tickFormatter={(value: number) => formatSpend(value)}
          />
          <YAxis yAxisId="runs" orientation="right" hide />
          <Tooltip
            cursor={false}
            content={(props) => (
              <ChartTooltipContent
                active={props.active}
                payload={props.payload}
                label={props.label}
                minValue={5}
                total={total(props.payload)}
                labelFormatter={(value) => formatDay(String(value))}
                valueFormatter={(value) => String(value)}
                totalFormatter={(value) => String(value)}
              />
            )}
          />
          <Bar
            yAxisId="spend"
            dataKey="credits"
            fill={chartSeriesColor("credits")}
            stroke="var(--card)"
            strokeWidth={1}
            isAnimationActive={false}
            radius={[2, 2, 0, 0]}
          />
          <Line
            yAxisId="runs"
            dataKey="runs"
            type="monotone"
            stroke={chartSeriesColor("runs")}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </ComposedChart>
      </Chart>
      <ChartLegend config={config} />
    </div>
  );
}
