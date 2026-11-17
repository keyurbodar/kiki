import {
  type CSSProperties,
  createContext,
  type ReactNode,
  useContext,
} from "react";
import { ResponsiveContainer } from "recharts";
import { Button } from "@/primitives/button";
import { Card, CardContent } from "@/primitives/card";
import { Chart } from "@/primitives/chart";

export const cx = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ");

const namedSeries = 8;

export const chartColor = (index: number) =>
  index < namedSeries ? `var(--chart-${index + 1})` : "var(--chart-other)";

const seriesVar = (key: string) =>
  `--chart-series-${Array.from(key, (c) => c.codePointAt(0) ?? 0).join("-")}`;

export const seriesColor = (key: string) => `var(${seriesVar(key)})`;

export type ChartConfig = Record<string, { label: ReactNode; color?: string }>;

const ChartConfigContext = createContext<ChartConfig>({});

export const chartMargin = { top: 4, right: 8, bottom: 0, left: 0 };

export function ChartContainer({
  config,
  className,
  children,
}: {
  config: ChartConfig;
  className?: string;
  children: ReactNode;
}) {
  const style = Object.fromEntries(
    Object.entries(config).map(([key, entry], index) => [
      seriesVar(key),
      entry.color ?? chartColor(index),
    ]),
  ) as CSSProperties;
  return (
    <ChartConfigContext.Provider value={config}>
      <Chart
        style={style}
        className={cx(
          "relative flex justify-center text-2xs text-muted-foreground-2",
          "[&_.recharts-surface]:outline-none [&_.recharts-wrapper]:outline-none",
          "[&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground-2",
          "[&_.recharts-cartesian-grid_line]:stroke-border-1",
          "[&_.recharts-reference-line_line]:stroke-border-2",
          className,
        )}
      >
        <ResponsiveContainer width="100%" height="100%">
          {children as never}
        </ResponsiveContainer>
      </Chart>
    </ChartConfigContext.Provider>
  );
}

type TooltipEntry = {
  dataKey?: unknown;
  name?: unknown;
  value?: unknown;
  color?: string;
  fill?: string;
};

export type ChartTooltipContentProps = {
  active?: boolean;
  payload?: ReadonlyArray<TooltipEntry>;
  label?: unknown;
  labelFormatter?: (label: string) => ReactNode;
  valueFormatter?: (value: number, key: string) => ReactNode;
  total?: boolean;
  footer?: ReactNode;
};

export function ChartTooltipContent({
  active,
  payload,
  label,
  labelFormatter,
  valueFormatter,
  total,
  footer,
}: ChartTooltipContentProps) {
  const config = useContext(ChartConfigContext);
  const rows = payload ?? [];
  if (!active || rows.length === 0) return null;
  const numbers = rows
    .map((row) => Number(row.value))
    .filter((value) => Number.isFinite(value));
  const sum =
    total === false || rows.length < 2
      ? undefined
      : numbers.reduce((a, b) => a + b, 0);
  const firstKey = String(rows[0]?.dataKey ?? rows[0]?.name ?? "");
  return (
    <div className="min-w-32 rounded-(--radius-overlay) border-(--border-width-hairline) border-border-2 bg-popover px-2.5 py-2 shadow-overlay">
      {label !== undefined && label !== null && (
        <div className="wrap-anywhere pb-1.5 text-2xs font-medium text-foreground">
          {labelFormatter ? labelFormatter(String(label)) : String(label)}
        </div>
      )}
      <div className="flex flex-col gap-1">
        {rows.map((row, index) => {
          const key = String(row.dataKey ?? row.name ?? index);
          const value = Number(row.value);
          return (
            <div key={key} className="flex items-center gap-2">
              <span
                className="size-2.5 shrink-0 rounded-(--radius-inner)"
                style={{
                  background: row.color ?? row.fill ?? seriesColor(key),
                }}
              />
              <span className="flex-1 text-2xs text-muted-foreground-1">
                {config[key]?.label ?? String(row.name ?? key)}
              </span>
              <span className="text-2xs font-medium text-foreground tabular-nums">
                {Number.isFinite(value) && valueFormatter
                  ? valueFormatter(value, key)
                  : String(row.value)}
              </span>
            </div>
          );
        })}
      </div>
      {sum !== undefined && (
        <div className="mt-1.5 flex items-center gap-2 border-t-(--border-width-hairline) border-border-1 pt-1.5">
          <span className="flex-1 text-2xs font-medium text-foreground">
            Total
          </span>
          <span className="text-2xs font-medium text-foreground tabular-nums">
            {valueFormatter ? valueFormatter(sum, firstKey) : String(sum)}
          </span>
        </div>
      )}
      {footer !== undefined && (
        <div className="mt-1.5 border-t-(--border-width-hairline) border-border-1 pt-1.5 text-2xs text-muted-foreground-2">
          {footer}
        </div>
      )}
    </div>
  );
}

export function ChartLegend({
  config,
  className,
}: {
  config: ChartConfig;
  className?: string;
}) {
  return (
    <div
      className={cx("flex flex-wrap items-center gap-x-4 gap-y-1.5", className)}
    >
      {Object.entries(config).map(([key, entry], index) => (
        <div key={key} className="flex items-center gap-1.5">
          <span
            className="size-2.5 shrink-0 rounded-(--radius-inner)"
            style={{ background: entry.color ?? chartColor(index) }}
          />
          <span className="text-2xs text-muted-foreground-1">
            {entry.label}
          </span>
        </div>
      ))}
    </div>
  );
}

export type SplitOption<T extends string> = readonly [T, string];

export function SplitControl<T extends string>({
  label = "Split",
  value,
  options,
  onChange,
}: {
  label?: string;
  value: T;
  options: ReadonlyArray<SplitOption<T>>;
  onChange: (value: T) => void;
}) {
  return (
    // biome-ignore lint/a11y/useSemanticElements: Capy renders the segmented control as a div with role="group"
    <div
      role="group"
      aria-label={label}
      className="relative flex items-center gap-0.5 rounded-lg border-(--border-width-hairline) border-border-2 bg-secondary p-0.5 [&>[data-selected]]:bg-card [&>[data-selected]]:shadow-card [&>button]:relative"
    >
      {options.map(([key, text]) => (
        <Button
          key={key}
          variant="segmented"
          size="xs"
          data-selected={value === key ? "" : undefined}
          aria-pressed={value === key}
          onClick={() => onChange(key)}
        >
          {text}
        </Button>
      ))}
    </div>
  );
}

export function ActivityNotice({
  children,
  action,
}: {
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-3 py-10 text-center">
        <span className="text-sm font-normal text-muted-foreground-2">
          {children}
        </span>
        {action}
      </CardContent>
    </Card>
  );
}

export function ActivityLoading({ children }: { children: ReactNode }) {
  return (
    <div
      role="status"
      aria-label="Loading"
      aria-busy
      className="animate-skeleton-pulse motion-reduce:animate-none"
    >
      {children}
    </div>
  );
}

export const skeletonBars = [
  62, 30, 30, 12, 4, 6, 78, 38, 42, 20, 18, 12, 4, 46, 68, 68, 58, 74, 4, 16,
  24, 42, 8, 46, 4, 4, 8, 82, 20, 40,
];

export function ChartSkeleton({
  height,
  legend,
}: {
  height: number;
  legend: number;
}) {
  return (
    <ActivityLoading>
      <Card>
        <CardContent className="flex flex-col gap-3">
          <div className="flex gap-2" style={{ height }}>
            <div className="flex w-6 shrink-0 flex-col justify-between py-1">
              {[0, 1, 2, 3, 4].map((tick) => (
                <span key={tick} className="h-2.5 w-3 rounded bg-secondary" />
              ))}
            </div>
            <div className="flex min-w-0 flex-1 items-end gap-1 pb-7">
              {skeletonBars.map((bar, index) => (
                <span
                  // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton bars
                  key={index}
                  className="flex-1 rounded-t-inner bg-secondary"
                  style={{ height: `${bar}%` }}
                />
              ))}
            </div>
          </div>
          {legend > 0 && (
            <div className="flex h-4 items-center gap-4">
              {Array.from({ length: legend }, (_, index) => index).map(
                (index) => (
                  <span key={index} className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-inner bg-secondary" />
                    <span className="h-3 w-16 rounded bg-secondary" />
                  </span>
                ),
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </ActivityLoading>
  );
}
