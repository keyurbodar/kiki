import { cx } from "class-variance-authority";
import {
  type ComponentProps,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  type Ref,
  type RefObject,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  clampSplitRatio,
  fullTileRect,
  layoutTiles,
  MIN_TILE_SIZE,
  measureSplit,
  minTileSize,
  TILE_RATIO_STEP,
  TILE_RATIO_STEP_LARGE,
  type TileBox,
  type TileNode,
  type TileRect,
  type TileSplit,
  tileLeafIds,
  tileNodeAt,
  tileRatioVar,
  tileRatioVars,
} from "./tiles";

const alwaysShown = () => true;

export type TileSurfaceProps = ComponentProps<"div"> & {
  /** The tile tree. Without it the surface renders its children as-is. */
  node?: TileNode;
  /** The tile that sorts first in the DOM, so it keeps focus order. */
  home?: string;
  /** Whether a tile is open. A closed tile stays mounted but hidden. */
  shown?: (id: string) => boolean;
  /** The tile that covers the whole surface, if any. */
  expanded?: string;
  renderGroup?: (id: string) => ReactNode;
  onRatio?: (path: string, ratio: number) => void;
  onExpand?: (id: string | undefined) => void;
};

/** features/thread/pane/tile-surface: the thread's split panes. */
export function TileSurface({
  node,
  home,
  shown = alwaysShown,
  expanded,
  renderGroup,
  onRatio,
  onExpand,
  className,
  style,
  ref,
  children,
  ...props
}: TileSurfaceProps) {
  const surface = useRef<HTMLDivElement | null>(null);
  const attach = (el: HTMLDivElement | null) => {
    surface.current = el;
    return assignRef(ref, el);
  };
  const classes = cx("relative min-h-0 min-w-0 flex-1", className);

  if (node === undefined) {
    return (
      <div
        ref={attach}
        data-tile-surface
        className={classes}
        style={style}
        {...props}
      >
        {children}
      </div>
    );
  }

  const layout = layoutTiles(node, shown);
  const laid = new Set(layout.leaves.map((leaf) => leaf.id));
  const open =
    expanded !== undefined && laid.has(expanded) ? expanded : undefined;
  const leaves = [
    ...layout.leaves.map((leaf) => ({ ...leaf, hidden: !shown(leaf.id) })),
    ...tileLeafIds(node)
      .filter((id) => !laid.has(id))
      .map((id) => ({ id, rect: fullTileRect, hidden: true })),
  ].sort((a, b) =>
    a.id === home ? -1 : b.id === home ? 1 : a.id < b.id ? -1 : 1,
  );
  const ratios = tileRatioVars(node);
  const vars = Object.fromEntries(ratios) as CSSProperties;
  const reset = Object.fromEntries(
    ratios.map(([name]) => [name, "initial"]),
  ) as CSSProperties;

  return (
    <div
      ref={attach}
      data-tile-surface
      className={classes}
      style={{ ...vars, ...style }}
      {...props}
    >
      {leaves.map((leaf) => (
        <TileLeaf
          key={leaf.id}
          id={leaf.id}
          rect={leaf.id === open ? fullTileRect : leaf.rect}
          hidden={leaf.hidden}
          covered={open !== undefined && leaf.id !== open}
          expanded={leaf.id === open}
          onToggle={
            layout.leaves.length > 1
              ? () => onExpand?.(leaf.id === open ? undefined : leaf.id)
              : undefined
          }
        >
          <div className="contents" style={reset}>
            {renderGroup?.(leaf.id)}
          </div>
        </TileLeaf>
      ))}
      {open === undefined &&
        layout.splits.map((split) => {
          const at = tileNodeAt(node, split.path);
          return (
            <TileDivider
              key={split.path}
              split={split}
              minFirst={
                at.kind === "split"
                  ? minTileSize(at.first, split.axis, shown)
                  : MIN_TILE_SIZE
              }
              minSecond={
                at.kind === "split"
                  ? minTileSize(at.second, split.axis, shown)
                  : MIN_TILE_SIZE
              }
              surface={surface}
              measure={(box) => measureSplit(node, split.path, box, shown)}
              ratioOf={() => {
                const current = tileNodeAt(node, split.path);
                return current.kind === "split" ? current.ratio : split.ratio;
              }}
              onCommit={(ratio) => onRatio?.(split.path, ratio)}
            />
          );
        })}
      {children}
    </div>
  );
}

function assignRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (typeof ref === "function") return ref(value);
  if (ref) ref.current = value;
}

export type TileLeafProps = {
  id: string;
  rect: TileRect;
  hidden?: boolean;
  /** Another tile is expanded over this one. */
  covered?: boolean;
  expanded?: boolean;
  /** Double-clicking the group's header strip toggles expansion. */
  onToggle?: () => void;
  children?: ReactNode;
};

/**
 * One tile. A tile that was closed and opens again slides in from the right
 * as it fades in; the first render never animates.
 */
export function TileLeaf({
  id,
  rect,
  hidden = false,
  covered = false,
  expanded = false,
  onToggle,
  children,
}: TileLeafProps) {
  const [wasHidden, setWasHidden] = useState(hidden);
  if (hidden && !wasHidden) setWasHidden(true);

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: double-clicking the header strip expands the tile, as in Capy
    <div
      data-tile-leaf={id}
      data-expanded={expanded ? "" : undefined}
      hidden={hidden}
      inert={covered || undefined}
      className={cx(
        "absolute flex min-h-0 min-w-0 flex-col overflow-hidden bg-panel",
        covered && "invisible",
        wasHidden &&
          !hidden &&
          "transition-[opacity,translate] duration-fast ease-out-quint starting:translate-x-1 starting:opacity-0 motion-reduce:transition-none",
      )}
      style={rect}
      onDoubleClick={(event) => {
        const target = event.target instanceof Element ? event.target : null;
        const strip = target?.closest("[data-tile-group]")?.firstElementChild;
        if (
          target !== null &&
          strip?.contains(target) === true &&
          target.closest(
            "button, a, input, textarea, [data-pane-tab], [role=menuitem]",
          ) === null
        ) {
          onToggle?.();
        }
      }}
    >
      {children}
    </div>
  );
}

export type TileGroupProps = {
  id: string;
  /** The group's tab strip. */
  strip?: ReactNode;
  /** Actions after the strip (expand, close). */
  trailing?: ReactNode;
  onFocus?: (id: string) => void;
  children?: ReactNode;
};

/** A tile's tab group: header strip over the active pane. */
export function TileGroup({
  id,
  strip,
  trailing,
  onFocus,
  children,
}: TileGroupProps) {
  return (
    <section
      data-tile-group={id}
      className="flex min-h-0 min-w-0 flex-1 flex-col"
      onPointerDownCapture={() => onFocus?.(id)}
      onFocusCapture={() => onFocus?.(id)}
    >
      <div className="flex min-h-11 shrink-0 items-center gap-1 border-b-hairline border-border-1 px-2">
        {strip}
        {trailing}
      </div>
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
        {children}
      </div>
    </section>
  );
}

export type TileDividerProps = {
  split: TileSplit;
  minFirst: number;
  minSecond: number;
  surface: RefObject<HTMLElement | null>;
  /** The split's own pixel box, from the surface's box. */
  measure: (box: TileBox) => TileBox;
  ratioOf: () => number;
  onCommit: (ratio: number) => void;
};

type Drag = {
  pointerId: number;
  handle: HTMLElement;
  start: number;
  size: number;
  origin: number;
  pending: number;
  moved: boolean;
  rafId: number | null;
};

const DRAG_SLOP = 2;

/**
 * The hairline between two tiles. Dragging writes the ratio straight to the
 * surface's custom property each frame and commits once on release; arrows
 * nudge it, Shift+arrows nudge it further, and a double-click evens it out.
 */
export function TileDivider({
  split,
  minFirst,
  minSecond,
  surface,
  measure,
  ratioOf,
  onCommit,
}: TileDividerProps) {
  const row = split.axis === "row";
  const ratioVar = tileRatioVar(split.path);
  const drag = useRef<Drag | null>(null);
  const latest = useRef({ ratioOf, onCommit });
  useEffect(() => {
    latest.current = { ratioOf, onCommit };
  });

  const span = () => {
    const el = surface.current;
    if (el === null) return undefined;
    const r = el.getBoundingClientRect();
    const box = measure({
      left: r.left,
      top: r.top,
      width: r.width,
      height: r.height,
    });
    return row
      ? { start: box.left, size: box.width }
      : { start: box.top, size: box.height };
  };
  const clamp = (ratio: number, size: number) =>
    clampSplitRatio(ratio, size, minFirst, minSecond);

  const end = (commit: boolean) => {
    const d = drag.current;
    if (d === null) return;
    drag.current = null;
    delete d.handle.dataset.dragging;
    if (d.rafId !== null) cancelAnimationFrame(d.rafId);
    document.body.style.removeProperty("cursor");
    document.body.style.removeProperty("user-select");
    const moved = commit && d.moved;
    surface.current?.style.setProperty(
      ratioVar,
      String(moved ? d.pending : latest.current.ratioOf()),
    );
    if (moved) latest.current.onCommit(d.pending);
  };
  const endRef = useRef(end);
  useEffect(() => {
    endRef.current = end;
  });
  useEffect(() => () => endRef.current(false), []);

  const onPointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    const s = span();
    if (event.button !== 0 || s === undefined) return;
    event.preventDefault();
    event.currentTarget.dataset.dragging = "";
    drag.current = {
      pointerId: event.pointerId,
      handle: event.currentTarget,
      start: s.start,
      size: s.size,
      origin: row ? event.clientX : event.clientY,
      pending: latest.current.ratioOf(),
      moved: false,
      rafId: null,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    document.body.style.cursor = row ? "col-resize" : "row-resize";
    document.body.style.userSelect = "none";
  };

  const onPointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    if (d === null || event.pointerId !== d.pointerId) return;
    const at = row ? event.clientX : event.clientY;
    if (Math.abs(at - d.origin) > DRAG_SLOP) d.moved = true;
    d.pending = clamp((at - d.start) / d.size, d.size);
    if (d.rafId === null) {
      d.rafId = requestAnimationFrame(() => {
        const current = drag.current;
        if (current === null) return;
        current.rafId = null;
        surface.current?.style.setProperty(ratioVar, String(current.pending));
      });
    }
  };

  const onPointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    if (d === null || event.pointerId !== d.pointerId) return;
    if (event.currentTarget.hasPointerCapture(d.pointerId)) {
      event.currentTarget.releasePointerCapture(d.pointerId);
    }
    end(true);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const back = row ? "ArrowLeft" : "ArrowUp";
    const forward = row ? "ArrowRight" : "ArrowDown";
    if (event.key !== back && event.key !== forward) return;
    event.preventDefault();
    const step = event.shiftKey ? TILE_RATIO_STEP_LARGE : TILE_RATIO_STEP;
    onCommit(
      clamp(
        latest.current.ratioOf() + (event.key === back ? -step : step),
        span()?.size ?? 0,
      ),
    );
  };

  const ratio = `var(${ratioVar})`;
  const { rect } = split;

  return (
    <div
      className={cx(
        "absolute z-(--z-tile-divider) bg-border-1",
        row ? "w-hairline" : "h-hairline",
      )}
      style={
        row
          ? {
              left: `calc(${rect.left} + ${rect.width} * ${ratio})`,
              top: rect.top,
              height: rect.height,
            }
          : {
              top: `calc(${rect.top} + ${rect.height} * ${ratio})`,
              left: rect.left,
              width: rect.width,
            }
      }
    >
      <button
        type="button"
        aria-label={row ? "Resize panes side by side" : "Resize stacked panes"}
        data-slot="tile-divider"
        className={cx(
          "absolute touch-none outline-none focus-visible:outline-ring-inset",
          "before:absolute before:rounded-full before:bg-(--ring) before:opacity-0 before:transition-opacity before:duration-fast before:ease-out-quint",
          "hover:before:opacity-100 hover:before:delay-hover-intent focus-visible:before:opacity-100 data-dragging:before:opacity-100 data-dragging:before:delay-0 motion-reduce:before:transition-none",
          "pointer-coarse:after:absolute pointer-coarse:after:top-1/2 pointer-coarse:after:left-1/2 pointer-coarse:after:-translate-x-1/2 pointer-coarse:after:-translate-y-1/2",
          row
            ? "inset-y-0 -left-1 w-2 cursor-col-resize before:inset-y-0 before:left-[calc(var(--spacing)*0.625)] before:w-[calc(var(--spacing)*0.75)] pointer-coarse:after:h-full pointer-coarse:after:w-11"
            : "inset-x-0 -top-1 h-2 cursor-row-resize before:inset-x-0 before:top-[calc(var(--spacing)*0.625)] before:h-[calc(var(--spacing)*0.75)] pointer-coarse:after:h-11 pointer-coarse:after:w-full",
        )}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onLostPointerCapture={() => end(true)}
        onDoubleClick={() => onCommit(clamp(0.5, span()?.size ?? 0))}
        onKeyDown={onKeyDown}
      />
    </div>
  );
}
