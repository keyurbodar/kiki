import { cx } from "class-variance-authority";
import {
  type ComponentProps,
  cloneElement,
  createContext,
  type ReactElement,
  type ReactNode,
  type SyntheticEvent,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import {
  Bar,
  BarChart,
  type BarShapeProps,
  ResponsiveContainer,
  usePlotArea,
  useXAxisDomain,
  useXAxisScale,
  useYAxisScale,
  XAxis,
  YAxis,
} from "recharts";
import {
  type ChartAxisId,
  type ChartDot,
  type ChartHighlight,
  type ChartHit,
  type ChartLayers,
  type ChartPointer,
  chartNumberAt,
  chartSeriesIndex,
  createChartPointer,
} from "./pointer";

export type ChartConfig = Record<string, { label: ReactNode; color?: string }>;

const CHART_PALETTE_SIZE = 8;
const PRELOAD_MARGIN = 200;

export const chartColor = (index: number) =>
  index < CHART_PALETTE_SIZE
    ? `var(--chart-${index + 1})`
    : "var(--chart-other)";

export const chartSeriesVar = (key: string) =>
  `--chart-series-${Array.from(key, (char) => char.codePointAt(0) ?? 0).join("-")}`;

export const chartSeriesColor = (key: string) => `var(${chartSeriesVar(key)})`;

const scrollParent = (node: HTMLElement | null): HTMLElement | null =>
  node === null || /auto|scroll/.test(getComputedStyle(node).overflowY)
    ? node
    : scrollParent(node.parentElement);

const ChartConfigContext = createContext<ChartConfig | null>(null);
const ChartLayersContext = createContext<ChartLayers | null>(null);

export function useChartConfig() {
  const config = useContext(ChartConfigContext);
  if (config === null)
    throw TypeError("Chart content must be used within a ChartContainer");
  return config;
}

export type ChartProps = ComponentProps<"div"> & { config?: ChartConfig };

const EMPTY_CONFIG: ChartConfig = {};

export function Chart({
  config = EMPTY_CONFIG,
  className,
  style,
  children,
  ref,
  ...props
}: ChartProps) {
  const [root, setRoot] = useState<HTMLDivElement | null>(null);
  const [under, setUnder] = useState<HTMLDivElement | null>(null);
  const [over, setOver] = useState<HTMLDivElement | null>(null);
  const [size, setSize] = useState<{ width: number; height: number }>();
  const measured = size !== undefined;
  const attach = useCallback(
    (node: HTMLDivElement | null) => {
      setRoot(node);
      if (typeof ref === "function") return ref(node);
      if (ref) ref.current = node;
    },
    [ref],
  );
  useEffect(() => {
    if (measured || root === null) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries.find((entry) => entry.isIntersecting);
        if (entry === undefined) return;
        observer.disconnect();
        startTransition(() =>
          setSize({
            width: Math.round(entry.boundingClientRect.width),
            height: Math.round(entry.boundingClientRect.height),
          }),
        );
      },
      {
        root: scrollParent(root.parentElement),
        rootMargin: `${PRELOAD_MARGIN}px 0%`,
      },
    );
    observer.observe(root);
    return () => observer.disconnect();
  }, [measured, root]);
  const vars = Object.fromEntries(
    Object.entries(config).map(([key, entry], index) => [
      chartSeriesVar(key),
      entry.color ?? chartColor(index),
    ]),
  );
  const layers = under === null || over === null ? null : { under, over };
  return (
    <ChartConfigContext value={config}>
      <ChartLayersContext value={layers}>
        <div
          data-slot="chart"
          ref={attach}
          style={{ ...vars, ...style }}
          className={cx(
            "relative flex justify-center text-2xs text-muted-foreground-2",
            "[&_.recharts-surface]:outline-none [&_.recharts-wrapper]:pointer-events-none [&_.recharts-wrapper]:outline-none",
            "[&>.recharts-responsive-container]:relative [&>.recharts-responsive-container]:will-change-transform",
            "[&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground-2",
            "[&_.recharts-cartesian-grid_line[stroke^='#'][stroke$='ccc']]:stroke-border-1",
            "[&_.recharts-reference-line_[stroke^='#'][stroke$='ccc']]:stroke-border-2",
            className,
          )}
          {...props}
        >
          <div
            ref={setUnder}
            className="pointer-events-none absolute inset-0"
          />
          {size !== undefined && (
            <ResponsiveContainer initialDimension={size}>
              {children}
            </ResponsiveContainer>
          )}
          <div ref={setOver} className="pointer-events-none absolute inset-0" />
        </div>
      </ChartLayersContext>
    </ChartConfigContext>
  );
}

export { chartSeriesClass } from "./pointer";
export { Chart as ChartContainer };

export const useChartPointer = () => useState(createChartPointer)[0];

export const chartSeriesHighlight = (pointer: ChartPointer) => ({
  onPointerOver: (event: SyntheticEvent) =>
    pointer.highlight(chartSeriesIndex(event.target)),
  onPointerLeave: () => pointer.highlight(undefined),
  onFocus: (event: SyntheticEvent) =>
    pointer.highlight(chartSeriesIndex(event.target)),
  onBlur: () => pointer.highlight(undefined),
});

function ChartAxisScale({
  pointer,
  id,
}: {
  pointer: ChartPointer;
  id: ChartAxisId;
}) {
  const scale = useYAxisScale(id);
  useEffect(() => {
    if (scale !== undefined) pointer.scale(id, (value) => scale(value));
  }, [pointer, id, scale]);
  return null;
}

export type ChartTooltipItem = {
  dataKey: string;
  name: string;
  value: number;
  color: string;
  fill: string;
  payload: object;
};

export type ChartTooltipState = {
  active: boolean;
  payload: ChartTooltipItem[];
  label: string | number | undefined;
  series: string | undefined;
};

export type ChartTooltipRender =
  | ReactElement<Partial<ChartTooltipState>>
  | ((state: ChartTooltipState) => ReactNode);

function ChartTooltipLayer({
  pointer,
  data,
  keys,
  content,
}: {
  pointer: ChartPointer;
  data: readonly object[];
  keys: readonly string[] | undefined;
  content: ChartTooltipRender;
}) {
  const config = useChartConfig();
  const domain = useXAxisDomain();
  const point = useSyncExternalStore(
    pointer.subscribe,
    pointer.get,
    pointer.get,
  );
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (ref.current !== null) pointer.fit();
  });
  const datum = point.day === undefined ? undefined : data[point.day];
  const label = point.day === undefined ? undefined : domain?.[point.day];
  const state: ChartTooltipState = {
    active: datum !== undefined,
    payload:
      datum === undefined
        ? []
        : Object.keys(config).flatMap((key) => {
            const value = chartNumberAt(datum, key);
            if (value === undefined) return [];
            const color = chartSeriesColor(key);
            return [
              {
                dataKey: key,
                name: key,
                value,
                color,
                fill: color,
                payload: datum,
              },
            ];
          }),
    label:
      typeof label === "string" || typeof label === "number"
        ? label
        : undefined,
    series: point.series === undefined ? undefined : keys?.[point.series],
  };
  return (
    <div
      ref={ref}
      data-chart-part="tooltip"
      role="status"
      className="pointer-events-none absolute top-0 left-0 will-change-transform"
    >
      {datum === undefined
        ? null
        : typeof content === "function"
          ? content(state)
          : cloneElement(content, state)}
    </div>
  );
}

const stopPropagation = (event: SyntheticEvent) => event.stopPropagation();
const alwaysSelectable = () => true;

export type ChartHoverProps = {
  pointer?: ChartPointer;
  data: readonly object[];
  content: ChartTooltipRender;
  highlight?: ChartHighlight;
  dots?: readonly ChartDot[];
  onSelect?: (hit: ChartHit) => void;
  selectable?: (hit: ChartHit) => boolean;
  label?: string;
};

const NO_DOTS: readonly ChartDot[] = [];

export function ChartHover({
  pointer,
  data,
  content,
  highlight,
  dots = NO_DOTS,
  onSelect,
  selectable,
  label = "Chart values, arrow keys move between points",
}: ChartHoverProps) {
  const own = useChartPointer();
  const active = pointer ?? own;
  const layers = useContext(ChartLayersContext);
  const plot = usePlotArea();
  const xScale = useXAxisScale();
  const domain = useXAxisDomain();
  useEffect(() => {
    active.attach(layers ?? undefined);
    return () => active.attach(undefined);
  }, [active, layers]);
  useEffect(() => {
    if (plot === undefined || xScale === undefined || domain === undefined)
      return;
    const first = domain[0];
    const start =
      first === undefined ? undefined : xScale(first, { position: "start" });
    const end =
      first === undefined ? undefined : xScale(first, { position: "end" });
    active.measure({
      plot,
      centers: domain.flatMap((value) => {
        const center = xScale(value, { position: "middle" });
        return center === undefined ? [] : [center];
      }),
      band: start === undefined || end === undefined ? 0 : end - start,
    });
  }, [active, plot, xScale, domain]);
  const first = domain?.[0];
  const thin =
    xScale === undefined ||
    first === undefined ||
    xScale(first, { position: "start" }) === xScale(first, { position: "end" });
  const canSelect =
    selectable ?? (onSelect === undefined ? undefined : alwaysSelectable);
  useEffect(() =>
    active.configure({ data, highlight, dots, selectable: canSelect }),
  );
  const axes = [
    ...new Set([
      ...(highlight === undefined ? [] : [highlight.yAxisId ?? 0]),
      ...dots.map((dot) => dot.yAxisId ?? 0),
    ]),
  ];
  const select = (hit: ChartHit | undefined) => {
    if (
      hit !== undefined &&
      onSelect !== undefined &&
      canSelect?.(hit) === true
    )
      onSelect(hit);
  };
  const cell = highlight?.mode === "cell";
  return (
    <>
      {axes.map((id) => (
        <ChartAxisScale key={id} pointer={active} id={id} />
      ))}
      {layers !== null &&
        createPortal(
          <div
            data-chart-part="cursor"
            aria-hidden
            className={cx(
              "invisible absolute top-0 left-0 will-change-transform",
              cell
                ? "rounded-(--radius-inner) border border-foreground"
                : thin
                  ? "w-px bg-border-2"
                  : "bg-secondary",
            )}
          />,
          cell ? layers.over : layers.under,
        )}
      {layers !== null &&
        createPortal(
          <>
            {dots.map((dot, index) => {
              const radius = dot.radius ?? 4;
              return (
                <span
                  key={dot.key}
                  data-chart-part={`dot-${index}`}
                  aria-hidden
                  className={cx(
                    "invisible absolute top-0 left-0 rounded-full will-change-transform",
                    dot.ring !== false && "ring-2 ring-card",
                  )}
                  style={{
                    background: chartSeriesColor(dot.key),
                    width: radius * 2,
                    height: radius * 2,
                    margin: -radius,
                  }}
                />
              );
            })}
            <div
              data-track-owner="ui/chart.tsx#ChartHover:div.1"
              role="application"
              aria-label={label}
              // biome-ignore lint/a11y/noNoninteractiveTabindex: Capy's chart surface is a focusable role="application"
              tabIndex={0}
              className="pointer-events-auto absolute inset-0 rounded outline-none focus-visible:outline-ring-inset"
              onPointerMove={(event) => {
                event.stopPropagation();
                active.point(event.currentTarget, event.clientX, event.clientY);
              }}
              onMouseMove={stopPropagation}
              onMouseDown={stopPropagation}
              onMouseUp={stopPropagation}
              onDoubleClick={stopPropagation}
              onContextMenu={stopPropagation}
              onTouchStart={stopPropagation}
              onTouchMove={stopPropagation}
              onTouchEnd={stopPropagation}
              onPointerLeave={(event) => active.leave(event.currentTarget)}
              onBlur={(event) => active.leave(event.currentTarget)}
              onFocus={(event) => {
                if (active.get().day === undefined)
                  active.step(event.currentTarget, 1);
              }}
              onKeyDown={(event) => {
                event.stopPropagation();
                if (event.key === "Escape") {
                  active.leave(event.currentTarget);
                  return;
                }
                if (event.key === "Enter") {
                  select(active.hit());
                  return;
                }
                const delta =
                  event.key === "ArrowRight"
                    ? 1
                    : event.key === "ArrowLeft"
                      ? -1
                      : undefined;
                if (
                  cell &&
                  (event.key === "ArrowUp" || event.key === "ArrowDown")
                ) {
                  event.preventDefault();
                  active.step(
                    event.currentTarget,
                    0,
                    event.key === "ArrowUp" ? 1 : -1,
                  );
                } else if (delta !== undefined) {
                  event.preventDefault();
                  active.step(event.currentTarget, delta);
                }
              }}
              onClick={(event) => {
                event.stopPropagation();
                select(
                  active.press(
                    event.currentTarget,
                    event.clientX,
                    event.clientY,
                  ),
                );
              }}
            />
            <ChartTooltipLayer
              pointer={active}
              data={data}
              keys={highlight?.keys}
              content={content}
            />
          </>,
          layers.over,
        )}
    </>
  );
}

export type ChartHeatmapCell = {
  column: number;
  row: number;
  value: number | null;
};

export type ChartHeatmapProps = {
  columns: readonly string[];
  rows: readonly string[];
  values: ReadonlyArray<ReadonlyArray<number | null>>;
  label?: string;
  valueLabel: ReactNode;
  content: (cell: ChartHeatmapCell) => ReactNode;
};

const HEATMAP_MARGIN = { top: 0, right: 0, bottom: 8, left: 0 };

export function ChartHeatmap({
  columns,
  rows,
  values,
  label,
  valueLabel,
  content,
}: ChartHeatmapProps) {
  const keys = rows.map((_, index) => `row${index}`);
  const max = Math.max(
    0,
    ...values.flatMap((column) =>
      column.flatMap((value) => (value === null ? [] : [value])),
    ),
  );
  const data = columns.map((column, index) => ({
    label: column,
    column: index,
    value: 0,
    ...Object.fromEntries(keys.map((key) => [key, 1])),
  }));
  const config = { value: { label: valueLabel, color: "var(--chart-1)" } };
  return (
    <div className="overflow-x-auto tabular-nums">
      <Chart
        config={config}
        className={cx(rows.length === 1 ? "h-28" : "h-60", "min-w-160")}
      >
        <BarChart
          accessibilityLayer={false}
          data={data}
          barCategoryGap={0}
          margin={HEATMAP_MARGIN}
        >
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            interval={0}
            tickFormatter={(value: string, index: number) =>
              index % 3 === 0 || index === columns.length - 1 ? value : ""
            }
            dy={8}
          />
          <YAxis
            domain={[0, rows.length]}
            ticks={rows.map((_, index) => index + 0.5)}
            tickFormatter={(value: number) =>
              rows[rows.length - 1 - Math.floor(value)] ?? ""
            }
            width={rows.length === 1 ? 0 : 32}
            axisLine={false}
            tickLine={false}
          />
          {keys.map((key, row) => (
            <Bar
              key={key}
              dataKey={key}
              stackId="cells"
              isAnimationActive={false}
              shape={(shape: BarShapeProps) => {
                const value =
                  values[shape.originalDataIndex]?.[rows.length - 1 - row] ??
                  null;
                return (
                  <rect
                    x={shape.x + 2}
                    y={shape.y + 2}
                    width={Math.max(0, shape.width - 4)}
                    height={Math.max(0, shape.height - 4)}
                    rx="var(--radius-inner)"
                    fill={
                      value === null
                        ? "var(--secondary)"
                        : chartSeriesColor("value")
                    }
                    fillOpacity={
                      value === null
                        ? 1
                        : 0.12 + 0.88 * (max === 0 ? 0 : value / max)
                    }
                  />
                );
              }}
            />
          ))}
          <ChartHover
            data={data}
            highlight={{ mode: "cell", keys }}
            label={label}
            content={({ payload, series }) => {
              const column = chartNumberAt(payload[0]?.payload, "column");
              const index = series === undefined ? -1 : keys.indexOf(series);
              const row = rows.length - 1 - index;
              return column === undefined || index === -1
                ? null
                : content({
                    column,
                    row,
                    value: values[column]?.[row] ?? null,
                  });
            }}
          />
        </BarChart>
      </Chart>
    </div>
  );
}

export type ChartTooltipEntry = {
  dataKey?: unknown;
  name?: string | number;
  value?: unknown;
  color?: string;
  fill?: string;
};

export type ChartTooltipContentProps = {
  active?: boolean;
  payload?: readonly ChartTooltipEntry[];
  label?: ReactNode;
  labelFormatter?: (label: ReactNode) => ReactNode;
  valueFormatter?: (value: number, key: string) => ReactNode;
  totalFormatter?: (total: number) => ReactNode;
  minValue?: number;
  total?: number | false;
  footer?: ReactNode;
};

const numericValue = (entry: ChartTooltipEntry) =>
  typeof entry.value === "number" ? entry.value : Number(entry.value);

export function ChartTooltipContent({
  active,
  payload,
  label,
  labelFormatter,
  valueFormatter,
  totalFormatter,
  minValue = 0,
  total,
  footer,
}: ChartTooltipContentProps) {
  const config = useChartConfig();
  const entries = payload ?? [];
  const finite = entries.flatMap((entry) => {
    const value = numericValue(entry);
    return Number.isFinite(value) ? [value] : [];
  });
  const visible = entries.filter((entry) => {
    const value = numericValue(entry);
    return !Number.isFinite(value) || Math.abs(value) >= minValue;
  });
  if (!active || visible.length === 0) return null;
  const sum =
    total === false
      ? undefined
      : visible.length > 1
        ? (total ?? finite.reduce((a, b) => a + b, 0))
        : undefined;
  const firstKey = String(visible[0]?.dataKey ?? visible[0]?.name ?? "");
  return (
    <div className="min-w-32 rounded-(--radius-overlay) border-hairline border-border-2 bg-popover px-2.5 py-2 shadow-overlay">
      {label !== undefined && (
        <div className="wrap-anywhere pb-1.5 text-2xs font-medium text-foreground">
          {labelFormatter ? labelFormatter(label) : label}
        </div>
      )}
      <div className="flex flex-col gap-1">
        {visible.map((entry, index) => {
          const key = String(entry.dataKey ?? entry.name ?? index);
          const value = numericValue(entry);
          return (
            <div key={key} className="flex items-center gap-2">
              <span
                className="size-2.5 shrink-0 rounded-(--radius-inner)"
                style={{
                  background:
                    entry.color ?? entry.fill ?? chartSeriesColor(key),
                }}
              />
              <span className="flex-1 text-2xs text-muted-foreground-1">
                {config[key]?.label ?? entry.name}
              </span>
              <span className="text-2xs font-medium text-foreground tabular-nums">
                {Number.isFinite(value) && valueFormatter
                  ? valueFormatter(value, key)
                  : String(entry.value)}
              </span>
            </div>
          );
        })}
      </div>
      {sum !== undefined && (
        <div className="mt-1.5 flex items-center gap-2 border-t-hairline border-border-1 pt-1.5">
          <span className="flex-1 text-2xs font-medium text-foreground">
            Total
          </span>
          <span className="text-2xs font-medium text-foreground tabular-nums">
            {totalFormatter
              ? totalFormatter(sum)
              : valueFormatter
                ? valueFormatter(sum, firstKey)
                : String(sum)}
          </span>
        </div>
      )}
      {footer !== undefined && (
        <div className="mt-1.5 border-t-hairline border-border-1 pt-1.5 text-2xs text-muted-foreground-2">
          {footer}
        </div>
      )}
    </div>
  );
}

export type ChartLegendProps = { config: ChartConfig; className?: string };

export function ChartLegend({ config, className }: ChartLegendProps) {
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
