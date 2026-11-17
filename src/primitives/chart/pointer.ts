export type ChartAxisId = string | number;

export type ChartPoint = {
  day: number | undefined;
  series: number | undefined;
};

export type ChartHit = { day: number; series: string | undefined };

export type ChartHighlight = {
  mode?: "cell" | "line";
  keys: readonly string[];
  yAxisId?: ChartAxisId;
  strokeWidth?: number;
};

export type ChartDot = {
  key: string;
  yAxisId?: ChartAxisId;
  radius?: number;
  ring?: boolean;
};

export type ChartLayers = { under: HTMLElement; over: HTMLElement };

export type ChartPlot = { x: number; y: number; width: number; height: number };

export type ChartPointerConfig = {
  data: readonly object[];
  highlight: ChartHighlight | undefined;
  dots: readonly ChartDot[];
  selectable: ((hit: ChartHit) => boolean) | undefined;
};

export type ChartPointer = {
  get: () => ChartPoint;
  hit: () => ChartHit | undefined;
  subscribe: (listener: () => void) => () => void;
  attach: (layers: ChartLayers | undefined) => void;
  configure: (config: ChartPointerConfig) => void;
  measure: (geometry: {
    plot: ChartPlot;
    centers: readonly number[];
    band: number;
  }) => void;
  scale: (
    id: ChartAxisId,
    scale: (value: number) => number | undefined,
  ) => void;
  fit: () => void;
  point: (target: HTMLElement, clientX: number, clientY: number) => void;
  press: (
    target: HTMLElement,
    clientX: number,
    clientY: number,
  ) => ChartHit | undefined;
  step: (target: HTMLElement, delta: number, rowDelta?: number) => void;
  highlight: (series: number | undefined) => void;
  leave: (target: HTMLElement) => void;
};

export const CHART_SERIES_CLASS = "chart-series";
const DIMMED_SVG = "0.18";
const DIMMED_HTML = "0.5";
const LINE_SNAP = 12;
const TOOLTIP_OFFSET = 10;

export const chartSeriesClass = (index: number) =>
  `${CHART_SERIES_CLASS} ${CHART_SERIES_CLASS}-${index}`;

export const chartSeriesIndex = (target: EventTarget | null) => {
  const series =
    target instanceof Element ? target.closest(`.${CHART_SERIES_CLASS}`) : null;
  const name = [...(series?.classList ?? [])].find((name) =>
    name.startsWith(`${CHART_SERIES_CLASS}-`),
  );
  return name === undefined
    ? undefined
    : Number(name.slice(CHART_SERIES_CLASS.length + 1));
};

export const chartNumberAt = (datum: object | undefined, key: string) => {
  const value = datum === undefined ? undefined : Reflect.get(datum, key);
  return typeof value === "number" ? value : undefined;
};

export const placeAlong = (
  anchor: number,
  size: number,
  start: number,
  length: number,
) => {
  const after = anchor + TOOLTIP_OFFSET;
  const position =
    after + size > start + length ? anchor - size - TOOLTIP_OFFSET : after;
  return Math.max(start, Math.min(position, start + length - size));
};

type SeriesNode = {
  index: number;
  node: HTMLElement | SVGElement;
  dimmed: string;
};

export function createChartPointer(): ChartPointer {
  let config: ChartPointerConfig = {
    data: [],
    highlight: undefined,
    dots: [],
    selectable: undefined,
  };
  let plot: ChartPlot = { x: 0, y: 0, width: 0, height: 0 };
  let centers: readonly number[] = [];
  let band = 0;
  const scales = new Map<string, (value: number) => number | undefined>();
  let state: ChartPoint = { day: undefined, series: undefined };
  let container: HTMLElement | undefined;
  let layers: ChartLayers | undefined;
  const parts = new Map<string, HTMLElement | null>();
  let seriesNodes: SeriesNode[] = [];
  let pending: { clientX: number; clientY: number } | undefined;
  let frame = 0;
  let anchor = { x: 0, y: 0 };
  let tooltipSize = { width: 0, height: 0 };
  const listeners = new Set<() => void>();

  const part = (name: string) => {
    const cached = parts.get(name);
    if (cached?.isConnected === true) return cached;
    const selector = `[data-chart-part="${name}"]`;
    const node =
      layers?.over.querySelector<HTMLElement>(selector) ??
      layers?.under.querySelector<HTMLElement>(selector) ??
      null;
    parts.set(name, node);
    return node;
  };
  const scope = () =>
    container?.closest<HTMLElement>("[data-slot=card]") ?? container;
  const scaleFor = (id: ChartAxisId | undefined) => scales.get(String(id ?? 0));
  const seriesKey = (index: number | undefined) =>
    index === undefined ? undefined : config.highlight?.keys[index];

  const dim = (series: number | undefined) => {
    if (config.highlight?.mode === "cell") return;
    const root = scope();
    if (root === undefined) return;
    if (seriesNodes.length === 0) {
      seriesNodes = [
        ...root.querySelectorAll<HTMLElement | SVGElement>(
          `.${CHART_SERIES_CLASS}:not(path)`,
        ),
      ].flatMap((node) => {
        const index = chartSeriesIndex(node);
        if (index === undefined) return [];
        const dimmed = node instanceof SVGElement ? DIMMED_SVG : DIMMED_HTML;
        return [{ index, node, dimmed }];
      });
    }
    const strokeWidth = config.highlight?.strokeWidth;
    for (const item of seriesNodes) {
      const active = series === item.index;
      item.node.style.opacity =
        series === undefined || active ? "" : item.dimmed;
      if (strokeWidth === undefined || !(item.node instanceof SVGElement))
        continue;
      const curve = item.node.querySelector<SVGElement>(".recharts-line-curve");
      if (curve !== null)
        curve.style.strokeWidth = active ? `${strokeWidth}px` : "";
    }
  };

  const placeTooltip = () => {
    const tooltip = part("tooltip");
    if (tooltip === null) return;
    const scroller =
      config.highlight?.mode === "cell" ? container?.parentElement : undefined;
    const left = Math.max(plot.x, scroller?.scrollLeft ?? plot.x);
    const right = Math.min(
      plot.x + plot.width,
      scroller == null
        ? plot.x + plot.width
        : scroller.scrollLeft + scroller.clientWidth,
    );
    const maxWidth = `${Math.max(0, right - left)}px`;
    if (tooltip.style.maxWidth !== maxWidth) {
      tooltip.style.maxWidth = maxWidth;
      tooltipSize = {
        width: tooltip.offsetWidth,
        height: tooltip.offsetHeight,
      };
    }
    const x = placeAlong(anchor.x, tooltipSize.width, left, right - left);
    const y = placeAlong(anchor.y, tooltipSize.height, plot.y, plot.height);
    tooltip.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  };

  const fitTooltip = () => {
    const tooltip = part("tooltip");
    if (tooltip === null) return;
    tooltip.style.maxWidth = `${plot.width}px`;
    tooltipSize = { width: tooltip.offsetWidth, height: tooltip.offsetHeight };
    placeTooltip();
  };

  const render = ({ day, series }: ChartPoint) => {
    const cursor = part("cursor");
    const datum = day === undefined ? undefined : config.data[day];
    const center = day === undefined ? undefined : centers[day];
    const key = seriesKey(series);
    if (cursor !== null) {
      if (center === undefined) {
        cursor.style.visibility = "hidden";
      } else {
        cursor.style.transform = `translate3d(${center - band / 2}px, ${plot.y}px, 0)`;
        if (band > 0) cursor.style.width = `${band}px`;
        cursor.style.height = `${plot.height}px`;
        cursor.style.visibility = "visible";
        if (config.highlight?.mode === "cell") {
          const rows = config.highlight.keys.length;
          const top =
            plot.y + ((rows - 1 - (series ?? 0)) * plot.height) / rows + 1;
          cursor.style.visibility = series === undefined ? "hidden" : "visible";
          cursor.style.transform = `translate3d(${center - band / 2 + 1}px, ${top}px, 0)`;
          cursor.style.width = `${Math.max(0, band - 2)}px`;
          cursor.style.height = `${Math.max(0, plot.height / rows - 2)}px`;
        }
      }
    }
    config.dots.forEach((dot, index) => {
      const node = part(`dot-${index}`);
      const value = chartNumberAt(datum, dot.key);
      const y =
        value === undefined ? undefined : scaleFor(dot.yAxisId)?.(value);
      if (node === null) return;
      const muted =
        key !== undefined &&
        key !== dot.key &&
        config.highlight?.keys.includes(dot.key) === true;
      if (center === undefined || y === undefined || muted) {
        node.style.visibility = "hidden";
        return;
      }
      node.style.transform = `translate3d(${center}px, ${y}px, 0)`;
      node.style.visibility = "visible";
    });
  };

  const update = (next: ChartPoint, target: HTMLElement | undefined) => {
    if (next.series !== state.series) dim(next.series);
    if (next.day !== state.day || next.series !== state.series) render(next);
    if (target !== undefined) {
      placeTooltip();
      const selectable =
        next.day !== undefined &&
        config.selectable?.({
          day: next.day,
          series: seriesKey(next.series),
        }) === true;
      target.style.cursor = selectable ? "pointer" : "";
    }
    if (next.series === state.series && next.day === state.day) return;
    const notify = next.day !== undefined || state.day !== undefined;
    state = next;
    if (notify) for (const listener of listeners) listener();
  };

  const seriesAt = (day: number, y: number) => {
    const highlight = config.highlight;
    const datum = config.data[day];
    const scale = scaleFor(highlight?.yAxisId);
    if (highlight === undefined || datum === undefined || scale === undefined)
      return undefined;
    const rows = highlight.keys.length;
    if (highlight.mode === "cell")
      return Math.min(
        rows - 1,
        Math.max(0, Math.floor((1 - (y - plot.y) / plot.height) * rows)),
      );
    if (highlight.mode === "line") {
      const nearest = highlight.keys
        .map((key, index) => {
          const value = chartNumberAt(datum, key);
          const position = value === undefined ? undefined : scale(value);
          const distance =
            position === undefined
              ? Number.POSITIVE_INFINITY
              : Math.abs(position - y);
          return { index, distance };
        })
        .reduce((best, item) => (item.distance < best.distance ? item : best), {
          index: -1,
          distance: LINE_SNAP,
        });
      return nearest.index === -1 ? undefined : nearest.index;
    }
    let positive = 0;
    let negative = 0;
    for (const [index, key] of highlight.keys.entries()) {
      const value = chartNumberAt(datum, key) ?? 0;
      const base = value < 0 ? negative : positive;
      const end = base + value;
      if (value < 0) negative = end;
      else positive = end;
      const upper = scale(Math.max(base, end));
      const lower = scale(Math.min(base, end));
      if (
        value !== 0 &&
        upper !== undefined &&
        lower !== undefined &&
        y >= upper &&
        y <= lower
      )
        return index;
    }
    return undefined;
  };

  const locate = (x: number, y: number): ChartPoint => {
    const count = Math.min(centers.length, config.data.length);
    if (
      count === 0 ||
      y < plot.y ||
      y > plot.y + plot.height ||
      x < plot.x ||
      x > plot.x + plot.width
    )
      return { day: undefined, series: undefined };
    let low = 0;
    let high = count - 1;
    while (low < high) {
      const mid = (low + high) >> 1;
      if ((centers[mid] ?? 0) < x) low = mid + 1;
      else high = mid;
    }
    const day =
      low > 0 && x - (centers[low - 1] ?? 0) < (centers[low] ?? 0) - x
        ? low - 1
        : low;
    const center = centers[day] ?? 0;
    anchor = { x: center, y };
    return config.highlight?.mode !== "cell" &&
      band > 0 &&
      Math.abs(x - center) > band * 0.4
      ? { day, series: undefined }
      : { day, series: seriesAt(day, y) };
  };

  const track = (target: HTMLElement, clientX: number, clientY: number) => {
    pending = undefined;
    const rect = target.getBoundingClientRect();
    update(locate(clientX - rect.left, clientY - rect.top), target);
  };

  const current = (): ChartHit | undefined =>
    state.day === undefined
      ? undefined
      : { day: state.day, series: seriesKey(state.series) };

  return {
    get: () => state,
    hit: current,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    attach: (next) => {
      layers = next;
      container = next?.over.parentElement ?? undefined;
      seriesNodes = [];
      parts.clear();
    },
    configure: (next) => {
      config = next;
      seriesNodes = [];
      if (state.series !== undefined) dim(state.series);
      if (state.day !== undefined) {
        render(state);
        placeTooltip();
      }
    },
    measure: (geometry) => {
      plot = geometry.plot;
      centers = geometry.centers;
      band = geometry.band;
      if (state.day === undefined) return;
      anchor = { x: centers[state.day] ?? anchor.x, y: anchor.y };
      render(state);
      fitTooltip();
    },
    scale: (id, scale) => {
      scales.set(String(id), scale);
    },
    fit: fitTooltip,
    point: (target, clientX, clientY) => {
      pending = { clientX, clientY };
      if (frame !== 0) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        if (pending !== undefined)
          track(target, pending.clientX, pending.clientY);
      });
    },
    press: (target, clientX, clientY) => {
      cancelAnimationFrame(frame);
      frame = 0;
      track(target, clientX, clientY);
      return current();
    },
    step: (target, delta, rowDelta = 0) => {
      const count = Math.min(centers.length, config.data.length);
      if (count === 0) return;
      const day = Math.min(
        count - 1,
        Math.max(0, (state.day ?? (delta > 0 ? -1 : count)) + delta),
      );
      const rows =
        config.highlight?.mode === "cell" ? config.highlight.keys.length : 0;
      const series =
        rows === 0
          ? undefined
          : Math.min(
              rows - 1,
              Math.max(0, (state.series ?? rows - 1) + rowDelta),
            );
      anchor = {
        x: centers[day] ?? 0,
        y:
          plot.y +
          (series === undefined
            ? plot.height / 2
            : ((rows - series - 0.5) * plot.height) / rows),
      };
      const scroller = rows === 0 ? undefined : container?.parentElement;
      if (
        scroller != null &&
        (anchor.x < scroller.scrollLeft ||
          anchor.x > scroller.scrollLeft + scroller.clientWidth)
      )
        scroller.scrollLeft = Math.max(0, anchor.x - scroller.clientWidth / 2);
      update({ day, series }, target);
    },
    highlight: (series) => update({ day: state.day, series }, undefined),
    leave: (target) => {
      cancelAnimationFrame(frame);
      frame = 0;
      pending = undefined;
      update({ day: undefined, series: undefined }, target);
    },
  };
}
