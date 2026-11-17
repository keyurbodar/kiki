/** biome-ignore-all lint/a11y/useSemanticElements: Capy renders the table as an ARIA grid of divs and spans for virtualization */
/** biome-ignore-all lint/a11y/useFocusableInteractive: cells take roving focus through the grid; the resize separator is pointer-only, as in Capy */
/** biome-ignore-all lint/suspicious/noArrayIndexKey: the loading skeleton is a fixed list */
import { cx } from "class-variance-authority";
import {
  type CSSProperties,
  type KeyboardEvent,
  memo,
  type PointerEvent,
  type ReactNode,
  type UIEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  CsvCellPreview,
  type CsvCellTarget,
  copyCell,
} from "@/components/csv-cell-preview";
import { DotGridIcon } from "@/primitives/dot-grid-icon";
import { SkeletonPanel } from "@/primitives/skeleton-panel";
import type { CsvWorkerRequest, CsvWorkerResponse } from "./csv.worker";
import {
  type CsvGrid,
  type CsvSort,
  cellText,
  parseCsv,
  type SortKeys,
  sortOrder,
} from "./csv-grid";
import { FileEmpty } from "./file-empty";
import { ArrowDownGlyph, ArrowUpGlyph } from "./glyphs";
import { SkeletonBar } from "./skeleton-bar";

export const ROW_HEIGHT = 28;
export const ROW_CHUNK = 16;
export const COLUMN_OVERSCAN = 4;
export const CHAR_WIDTH = 8;
export const CELL_PADDING = 24;
export const MIN_COLUMN_WIDTH = 48;
export const MAX_COLUMN_WIDTH = 960;
export const WORKER_THRESHOLD = 1_000_000;
const SKELETON_WIDTHS = [
  "w-3/5",
  "w-4/5",
  "w-2/3",
  "w-3/4",
  "w-1/2",
  "w-4/5",
  "w-3/5",
  "w-2/3",
];

export type CsvSheet = {
  grid: CsvGrid;
  spans: Map<number, Map<number, number>>;
  pending: Set<number>;
  notices: string[];
  footer?: ReactNode;
};

export type CsvTableProps = {
  text: string;
  name: string;
  truncated: boolean;
  onViewport?: (element: HTMLDivElement | null) => void;
  sheet?: CsvSheet;
};

type CellAt = { position: number; column: number };
type CellHit = CellAt & { cell: HTMLElement; end: number };
type Preview = {
  text: string;
  at: CellAt;
  open: boolean;
  target: CsvCellTarget;
};
type Parsed = { text: string; grid: CsvGrid } | { text: string; failed: true };

export const columnLayout = (
  grid: CsvGrid,
  overrides?: Map<number, number>,
) => {
  const widths = grid.widths.map(
    (chars, column) =>
      overrides?.get(column) ?? chars * CHAR_WIDTH + CELL_PADDING,
  );
  const offsets = widths.reduce<number[]>(
    (sums, width) => {
      sums.push((sums.at(-1) ?? 0) + width);
      return sums;
    },
    [0],
  );
  const body = Math.max(0, grid.rows - 1);
  return {
    widths,
    offsets,
    body,
    gutter: String(body).length * CHAR_WIDTH + 16,
  };
};

export const visibleColumns = (
  layout: { widths: number[]; offsets: number[]; gutter: number },
  columns: number,
  scrollLeft: number,
  clientWidth: number,
) => {
  const right = scrollLeft + clientWidth - layout.gutter;
  const first = layout.offsets.findIndex(
    (offset, column) => offset + (layout.widths[column] ?? 0) > scrollLeft,
  );
  const last = layout.offsets.findIndex((offset) => offset >= right);
  return {
    first: Math.max(0, (first === -1 ? columns : first) - COLUMN_OVERSCAN),
    last: Math.min(columns, (last === -1 ? columns : last) + COLUMN_OVERSCAN),
  };
};

const createWorker = () => {
  try {
    return new Worker(new URL("./csv.worker.ts", import.meta.url), {
      type: "module",
    });
  } catch {
    return undefined;
  }
};

const findCell = (root: HTMLElement, { position, column }: CellAt) =>
  [
    ...root.querySelectorAll<HTMLElement>(
      `[role="row"][aria-rowindex="${position + 2}"] > [role="gridcell"]`,
    ),
  ].find(
    (cell) =>
      Number(cell.getAttribute("aria-colindex")) - 1 <= column &&
      column < Number(cell.dataset.end),
  ) ?? null;

const hitCell = (target: EventTarget): CellHit | undefined => {
  const cell =
    target instanceof Element
      ? target.closest<HTMLElement>('[role="gridcell"]')
      : null;
  const row = cell?.parentElement;
  if (cell == null || row == null) return undefined;
  return {
    cell,
    position: Number(row.getAttribute("aria-rowindex")) - 2,
    column: Number(cell.getAttribute("aria-colindex")) - 1,
    end: Number(cell.dataset.end),
  };
};

const hasSelection = () => (window.getSelection()?.toString() ?? "") !== "";

export function CsvTable({
  text,
  name,
  truncated,
  onViewport,
  sheet,
}: CsvTableProps) {
  const delimiter = /\.tsv$/i.test(name) ? "\t" : ",";
  const [fallback, setFallback] = useState(false);
  const sheetGrid = sheet?.grid;
  const syncGrid = useMemo(
    () =>
      sheetGrid ??
      (text.length > WORKER_THRESHOLD && !fallback
        ? undefined
        : parseCsv(text, delimiter, truncated)),
    [sheetGrid, text, delimiter, truncated, fallback],
  );
  const [parsed, setParsed] = useState<Parsed>();
  const [sort, setSort] = useState<CsvSort>();
  const [workerOrder, setWorkerOrder] = useState<{
    text: string;
    sort: CsvSort;
    order: Uint32Array;
  }>();
  const worker = useRef<Worker | null>(null);
  const pendingSort = useRef<{ id: number; sort: CsvSort } | undefined>(
    undefined,
  );

  useEffect(() => {
    if (syncGrid !== undefined) return;
    const instance = createWorker();
    if (instance === undefined) {
      setFallback(true);
      return;
    }
    worker.current = instance;
    instance.onmessage = (event: MessageEvent<CsvWorkerResponse>) => {
      const response = event.data;
      if (response.type === "parsed") {
        setParsed({ text, grid: response.grid });
        return;
      }
      const pending = pendingSort.current;
      if (pending?.id === response.id) {
        setWorkerOrder({ text, sort: pending.sort, order: response.order });
      }
    };
    instance.onerror = (event) =>
      event instanceof ErrorEvent && event.message !== ""
        ? setParsed({ text, failed: true })
        : setFallback(true);
    instance.onmessageerror = () => setFallback(true);
    instance.postMessage({
      type: "parse",
      text,
      delimiter,
      truncated,
    } satisfies CsvWorkerRequest);
    return () => {
      instance.terminate();
      worker.current = null;
      pendingSort.current = undefined;
    };
  }, [syncGrid, text, delimiter, truncated]);

  const current = parsed?.text === text ? parsed : undefined;
  const table = useMemo(
    () =>
      syncGrid === undefined
        ? current !== undefined && "grid" in current
          ? current
          : undefined
        : { text, grid: syncGrid },
    [current, syncGrid, text],
  );
  const [lastTable, setLastTable] = useState(table);
  if (table !== undefined && table !== lastTable) setLastTable(table);
  const shown = table ?? (current === undefined ? lastTable : undefined);
  const grid = shown?.grid;
  const source = shown?.text ?? text;

  const sortCache = useMemo(() => {
    void syncGrid;
    return new Map<number, SortKeys>();
  }, [syncGrid]);
  const syncOrder =
    syncGrid === undefined || sort === undefined
      ? undefined
      : sortOrder(text, syncGrid, sortCache, sort.column, sort.direction);

  useEffect(() => {
    if (syncGrid !== undefined || grid === undefined || sort === undefined)
      return;
    const id = (pendingSort.current?.id ?? 0) + 1;
    pendingSort.current = { id, sort };
    worker.current?.postMessage({
      type: "sort",
      id,
      ...sort,
    } satisfies CsvWorkerRequest);
  }, [syncGrid, grid, sort]);

  const asyncOrder =
    workerOrder?.text === source && workerOrder.sort === sort
      ? workerOrder.order
      : undefined;
  const order = sort === undefined ? undefined : (syncOrder ?? asyncOrder);
  const sorting =
    sort !== undefined && syncGrid === undefined && asyncOrder === undefined;

  const [resized, setResized] = useState<{
    grid: CsvGrid;
    widths: Map<number, number>;
  }>();
  const overrides =
    resized !== undefined && resized.grid === grid ? resized.widths : undefined;
  const layout = useMemo(
    () => (grid === undefined ? undefined : columnLayout(grid, overrides)),
    [grid, overrides],
  );

  const [viewport, setViewport] = useState<HTMLDivElement | null>(null);
  const [firstRow, setFirstRow] = useState(0);
  const scrollPosition = useRef({ top: 0, left: 0 });
  const attachViewport = (element: HTMLDivElement | null) => {
    if (element !== null) {
      element.scrollTop = scrollPosition.current.top;
      element.scrollLeft = scrollPosition.current.left;
    }
    setViewport(element);
    onViewport?.(element);
    if (element !== null) {
      setFirstRow(
        Math.floor(element.scrollTop / ROW_HEIGHT / ROW_CHUNK) * ROW_CHUNK,
      );
    }
  };
  const [viewportHeight, setViewportHeight] = useState(0);
  const [firstColumn, setFirstColumn] = useState(0);
  const [lastColumn, setLastColumn] = useState(0);
  const measureColumns = (element: HTMLDivElement) => {
    if (grid === undefined || layout === undefined) return;
    const range = visibleColumns(
      layout,
      grid.columns,
      element.scrollLeft,
      element.clientWidth,
    );
    setFirstColumn(range.first);
    setLastColumn(range.last);
  };
  useEffect(() => {
    if (viewport === null || grid === undefined || layout === undefined) return;
    const measure = () => {
      setViewportHeight(viewport.clientHeight);
      const range = visibleColumns(
        layout,
        grid.columns,
        viewport.scrollLeft,
        viewport.clientWidth,
      );
      setFirstColumn(range.first);
      setLastColumn(range.last);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    measure();
    return () => observer.disconnect();
  }, [viewport, grid, layout]);

  const [preview, setPreview] = useState<Preview>();
  const pendingFocus = useRef<CellAt | undefined>(undefined);
  useEffect(() => {
    const at = pendingFocus.current;
    if (at === undefined || viewport === null) return;
    const cell = findCell(viewport, at);
    if (cell !== null) {
      pendingFocus.current = undefined;
      cell.focus({ preventScroll: true });
    }
  });

  if (current !== undefined && "failed" in current) {
    return <FileEmpty line="Could not read this table" />;
  }
  if (grid === undefined || layout === undefined) {
    return (
      <SkeletonPanel className="flex min-h-0 flex-1 flex-col bg-card">
        <div
          role="status"
          aria-live="polite"
          aria-busy="true"
          className="sr-only"
        >
          Reading table
        </div>
        <div aria-hidden className="contents">
          <div className="flex h-7 shrink-0 items-center gap-6 border-b-hairline border-border-1 px-3">
            {SKELETON_WIDTHS.slice(0, 5).map((width, index) => (
              <SkeletonBar
                key={index}
                className={cx("h-2.5 max-w-24 flex-1", width)}
              />
            ))}
          </div>
          {SKELETON_WIDTHS.map((width, index) => (
            <div
              key={index}
              className="flex h-7 items-center border-b-hairline border-border-1 px-3"
            >
              <SkeletonBar className={cx("h-2.5", width)} />
            </div>
          ))}
        </div>
      </SkeletonPanel>
    );
  }
  if (grid.columns === 0) return <FileEmpty line="Empty file" />;

  const last = Math.min(lastColumn, grid.columns);
  const first = Math.min(firstColumn, last);
  const columns = Array.from(
    { length: last - first },
    (_, index) => first + index,
  );
  const leading = layout.offsets[first] ?? 0;
  const trailing =
    (layout.offsets[grid.columns] ?? 0) - (layout.offsets[last] ?? 0);
  const template = `${layout.gutter}px ${leading}px ${columns.map((column) => `${layout.widths[column]}px`).join(" ")} ${trailing}px minmax(0,1fr)`;
  const startRow = Math.max(0, firstRow - ROW_CHUNK);
  const endRow = Math.min(
    layout.body,
    firstRow + Math.ceil(viewportHeight / ROW_HEIGHT) + 32,
  );
  const positions = Array.from(
    { length: Math.max(0, endRow - startRow) },
    (_, index) => startRow + index,
  );
  const rowAt = (position: number) =>
    order === undefined ? position : (order[position] ?? position);
  const valueAt = ({ position, column }: CellAt) =>
    cellText(source, grid, rowAt(position) + 1, column);

  const openPreview = (anchor: HTMLElement, at: CellAt) =>
    setPreview({
      text: source,
      at: { position: at.position, column: at.column },
      open: true,
      target: {
        anchor,
        column: cellText(source, grid, 0, at.column),
        row: rowAt(at.position) + 1,
        value: valueAt(at),
      },
    });

  const moveTo = (
    element: HTMLDivElement,
    position: number,
    column: number,
  ) => {
    if (layout.body === 0) return;
    const at = {
      position: Math.max(0, Math.min(layout.body - 1, position)),
      column: Math.max(0, Math.min(grid.columns - 1, column)),
    };
    const top = at.position * ROW_HEIGHT;
    if (top < element.scrollTop) element.scrollTop = top;
    else if (top + 2 * ROW_HEIGHT > element.scrollTop + element.clientHeight) {
      element.scrollTop = top + 2 * ROW_HEIGHT - element.clientHeight;
    }
    const left = layout.offsets[at.column] ?? 0;
    const right = layout.gutter + (layout.offsets[at.column + 1] ?? left);
    if (left < element.scrollLeft) element.scrollLeft = left;
    else if (right > element.scrollLeft + element.clientWidth) {
      element.scrollLeft = Math.min(left, right - element.clientWidth);
    }
    const cell = findCell(element, at);
    if (cell === null) pendingFocus.current = at;
    else cell.focus({ preventScroll: true });
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const hit = hitCell(event.target);
    const element = event.currentTarget;
    if (hit === undefined) {
      if (
        event.target !== element ||
        (event.key !== "Enter" && event.key !== "ArrowDown")
      )
        return;
      event.preventDefault();
      moveTo(
        element,
        Math.ceil(element.scrollTop / ROW_HEIGHT),
        Math.max(
          0,
          layout.offsets.findIndex((offset) => offset >= element.scrollLeft),
        ),
      );
      return;
    }
    const modifier = event.metaKey || event.ctrlKey;
    const page = Math.max(1, Math.floor(element.clientHeight / ROW_HEIGHT) - 2);
    const next: [number, number] | undefined =
      event.key === "ArrowDown"
        ? [modifier ? layout.body - 1 : hit.position + 1, hit.column]
        : event.key === "ArrowUp"
          ? [modifier ? 0 : hit.position - 1, hit.column]
          : event.key === "ArrowRight"
            ? [hit.position, modifier ? grid.columns - 1 : hit.end]
            : event.key === "ArrowLeft"
              ? [hit.position, modifier ? 0 : hit.column - 1]
              : event.key === "Home"
                ? [modifier ? 0 : hit.position, 0]
                : event.key === "End"
                  ? [
                      modifier ? layout.body - 1 : hit.position,
                      grid.columns - 1,
                    ]
                  : event.key === "PageDown"
                    ? [hit.position + page, hit.column]
                    : event.key === "PageUp"
                      ? [hit.position - page, hit.column]
                      : undefined;
    if (next !== undefined) {
      event.preventDefault();
      moveTo(element, ...next);
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      openPreview(hit.cell, hit);
      return;
    }
    if (modifier && event.key.toLowerCase() === "c" && !hasSelection()) {
      event.preventDefault();
      void copyCell(valueAt(hit));
    }
  };

  const setWidth = (column: number, width: number | undefined) =>
    setResized((previous) => {
      const widths = new Map(previous?.grid === grid ? previous.widths : []);
      if (width === undefined) widths.delete(column);
      else
        widths.set(
          column,
          Math.round(
            Math.min(MAX_COLUMN_WIDTH, Math.max(MIN_COLUMN_WIDTH, width)),
          ),
        );
      return { grid, widths };
    });

  const startResize = (
    event: PointerEvent<HTMLSpanElement>,
    column: number,
  ) => {
    event.preventDefault();
    const handle = event.currentTarget;
    const startX = event.clientX;
    const startWidth = layout.widths[column] ?? 0;
    handle.setPointerCapture(event.pointerId);
    const stop = () => {
      handle.onpointermove = null;
      handle.onpointerup = null;
      handle.onpointercancel = null;
    };
    handle.onpointermove = (move) =>
      setWidth(column, startWidth + move.clientX - startX);
    handle.onpointerup = stop;
    handle.onpointercancel = stop;
  };

  const toggleSort = (column: number) =>
    setSort(
      sort?.column === column
        ? sort.direction === "ascending"
          ? { column, direction: "descending" }
          : undefined
        : { column, direction: "ascending" },
    );

  const onScroll = (event: UIEvent<HTMLDivElement>) => {
    if (preview?.open === true) setPreview({ ...preview, open: false });
    const element = event.currentTarget;
    scrollPosition.current = {
      top: element.scrollTop,
      left: element.scrollLeft,
    };
    setFirstRow(
      Math.floor(element.scrollTop / ROW_HEIGHT / ROW_CHUNK) * ROW_CHUNK,
    );
    measureColumns(element);
  };

  const onClick = (event: { target: EventTarget }) => {
    const hit = hitCell(event.target);
    if (hit === undefined || hasSelection()) return;
    if (
      hit.cell.scrollWidth > hit.cell.clientWidth ||
      /[\n\r\t]|\s{2}/.test(valueAt(hit))
    ) {
      openPreview(hit.cell, hit);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-card">
      {grid.ragged > 0 && (
        <div className="shrink-0 border-b-hairline border-border-1 px-3 py-1 text-2xs text-muted-foreground-2">
          {grid.ragged.toLocaleString()}{" "}
          {grid.ragged === 1 ? "row has" : "rows have"} a different column count
          than the header
        </div>
      )}
      {sheet?.notices.map((notice) => (
        <div
          key={notice}
          className="shrink-0 border-b-hairline border-border-1 px-3 py-1 text-2xs text-muted-foreground-2"
        >
          {notice}
        </div>
      ))}
      <div
        key={source.length}
        ref={attachViewport}
        role="grid"
        aria-rowcount={layout.body + 1}
        aria-colcount={grid.columns}
        aria-busy={sorting}
        tabIndex={0}
        className="isolate min-h-0 flex-1 overflow-auto overscroll-contain text-xs outline-none [overflow-anchor:none] focus-visible:outline-ring-inset"
        style={{
          scrollPaddingTop: ROW_HEIGHT,
          scrollPaddingLeft: layout.gutter,
        }}
        onKeyDown={onKeyDown}
        onClick={onClick}
        onScroll={onScroll}
      >
        <div className="w-max min-w-full">
          <div
            role="row"
            aria-rowindex={1}
            className="sticky top-0 z-(--z-table-lead) grid border-b-hairline border-border-1 bg-card"
            style={{ gridTemplateColumns: template }}
          >
            <span className="sticky left-0 border-r-hairline border-border-1 bg-card" />
            <span />
            {columns.map((column) => {
              const direction =
                sort?.column === column ? sort.direction : undefined;
              const label = cellText(source, grid, 0, column);
              if (sheet !== undefined) {
                return (
                  <span
                    key={column}
                    role="columnheader"
                    aria-colindex={column + 1}
                    className="h-7 truncate text-center font-mono text-2xs leading-7 text-muted-foreground-2"
                  >
                    {label}
                  </span>
                );
              }
              return (
                <div
                  key={column}
                  role="columnheader"
                  aria-colindex={column + 1}
                  aria-sort={direction ?? "none"}
                  className="relative flex min-w-0"
                >
                  <button
                    type="button"
                    title={label}
                    className={cx(
                      "flex h-7 min-w-0 flex-1 items-center gap-1 px-3 text-left font-medium text-muted-foreground-1 outline-none hover:text-foreground focus-visible:outline-ring-inset",
                      grid.numeric[column] === true &&
                        "flex-row-reverse text-right",
                      direction !== undefined && "text-foreground",
                    )}
                    onClick={() => toggleSort(column)}
                  >
                    <span className="min-w-0 truncate">{label}</span>
                    {direction === "ascending" ? (
                      <ArrowUpGlyph className="size-(--icon-xs) shrink-0" />
                    ) : direction === "descending" ? (
                      <ArrowDownGlyph className="size-(--icon-xs) shrink-0" />
                    ) : null}
                  </button>
                  <span
                    role="separator"
                    aria-orientation="vertical"
                    aria-label={`Resize ${label}`}
                    className="absolute inset-y-0 right-0 w-2 cursor-col-resize touch-none after:absolute after:inset-y-1.5 after:right-0 after:w-px hover:after:bg-border-2"
                    onPointerDown={(event) => startResize(event, column)}
                    onDoubleClick={() => setWidth(column, undefined)}
                  />
                </div>
              );
            })}
          </div>
          <div
            className="relative"
            style={{ height: layout.body * ROW_HEIGHT }}
          >
            <div
              className="absolute inset-x-0 top-0"
              style={{ transform: `translateY(${startRow * ROW_HEIGHT}px)` }}
            >
              {positions.map((position) => {
                const index = rowAt(position);
                return (
                  <CsvRow
                    key={index}
                    text={source}
                    grid={grid}
                    index={index}
                    position={position}
                    template={template}
                    firstColumn={first}
                    lastColumn={last}
                    expandedColumn={
                      preview?.open === true &&
                      preview.text === source &&
                      preview.at.position === position
                        ? preview.at.column
                        : undefined
                    }
                    spans={sheet?.spans.get(index)}
                    pending={sheet?.pending}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
      <div className="flex h-7 shrink-0 items-center gap-2 border-t-hairline border-border-1 px-3 text-2xs text-muted-foreground-2 tabular-nums">
        {sheet?.footer}
        <span className={cx(sheet !== undefined && "ml-auto shrink-0")}>
          {truncated || table === undefined ? "First " : ""}
          {layout.body.toLocaleString()} {layout.body === 1 ? "row" : "rows"},{" "}
          {grid.columns.toLocaleString()}{" "}
          {grid.columns === 1 ? "column" : "columns"}
        </span>
        {sorting && (
          <DotGridIcon
            size="xs"
            role="status"
            aria-hidden={false}
            aria-label="Sorting"
          />
        )}
      </div>
      <CsvCellPreview
        target={preview?.text === source ? preview.target : undefined}
        open={preview?.open === true}
        onClose={() =>
          setPreview((value) => value && { ...value, open: false })
        }
      />
    </div>
  );
}

type CsvRowProps = {
  text: string;
  grid: CsvGrid;
  index: number;
  position: number;
  template: string;
  firstColumn: number;
  lastColumn: number;
  expandedColumn: number | undefined;
  spans: Map<number, number> | undefined;
  pending: Set<number> | undefined;
};

export const CsvRow = memo(function CsvRow({
  text,
  grid,
  index,
  position,
  template,
  firstColumn,
  lastColumn,
  expandedColumn,
  spans,
  pending,
}: CsvRowProps) {
  const anchors = new Map(
    [...(spans ?? [])].flatMap(([anchor, span]) => {
      const start = Math.max(anchor, firstColumn);
      return anchor + span > start
        ? [[start, { anchor, span: anchor + span - start }] as const]
        : [];
    }),
  );
  const covered = new Set(
    [...anchors].flatMap(([start, { span }]) =>
      Array.from({ length: span - 1 }, (_, offset) => start + offset + 1),
    ),
  );
  return (
    <div
      role="row"
      aria-rowindex={position + 2}
      className="grid h-7 border-b-hairline border-border-1 hover:bg-card-hover"
      style={{ gridTemplateColumns: template }}
    >
      <span className="sticky left-0 border-r-hairline border-border-1 bg-card pr-2 text-right font-mono text-2xs leading-7 text-muted-foreground-3 tabular-nums">
        {index + 1}
      </span>
      <span />
      {Array.from({ length: lastColumn - firstColumn }, (_, offset) => {
        const column = firstColumn + offset;
        if (covered.has(column)) return null;
        const merged = anchors.get(column);
        const source = merged?.anchor ?? column;
        const value = cellText(text, grid, index + 1, source);
        const span = Math.min(merged?.span ?? 1, lastColumn - column);
        const formula = pending?.has(index * grid.columns + source) === true;
        const style: CSSProperties | undefined =
          spans === undefined
            ? undefined
            : { gridColumn: `${offset + 3} / span ${span}` };
        return (
          <span
            key={column}
            role="gridcell"
            aria-colindex={source + 1}
            aria-colspan={span > 1 ? span : undefined}
            data-end={column + (merged?.span ?? 1)}
            tabIndex={-1}
            title={value}
            data-expanded={source === expandedColumn ? "" : undefined}
            style={style}
            className={cx(
              "truncate px-3 leading-7 text-foreground outline-none focus-visible:outline-ring-inset data-[expanded]:outline-ring-inset",
              grid.numeric[source] === true &&
                "text-right font-mono tabular-nums",
              formula && "font-mono text-muted-foreground-3",
            )}
          >
            {value.replace(/\s+/g, " ")}
          </span>
        );
      })}
    </div>
  );
});
