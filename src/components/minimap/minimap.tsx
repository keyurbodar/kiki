import { cx } from "class-variance-authority";
import {
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
  useRef,
  useState,
} from "react";

/** Keeps a preview this far from the viewport edge, in CSS pixels. */
const EDGE_MARGIN = 40;
/** A pressed rail grows up to this many times its resting length. */
const GROW_VERTICAL = 2;
const GROW_HORIZONTAL = 3;
/** Room the grown rail leaves for the app chrome, in rem. */
const CHROME_VERTICAL = 18;
const CHROME_HORIZONTAL = 6;

/** Where tick `index` of `count` sits along the rail, in percent. */
export const tickPercent = (index: number, count: number) =>
  count <= 1
    ? 50
    : (Math.max(0, Math.min(index, count - 1)) / (count - 1)) * 100;

/** The tick nearest the pointer, or null on an empty rail. */
export const tickAtPointer = (rail: {
  itemCount: number;
  railStart: number;
  railSize: number;
  pointer: number;
}) => {
  if (rail.itemCount <= 0 || rail.railSize <= 0) return null;
  if (rail.itemCount === 1) return 0;
  const t = Math.max(
    0,
    Math.min(1, (rail.pointer - rail.railStart) / rail.railSize),
  );
  return Math.max(
    0,
    Math.min(rail.itemCount - 1, Math.round(t * (rail.itemCount - 1))),
  );
};

/** Resting rail length: two spacing units per gap, capped by the viewport. */
export const railHeight = (count: number) =>
  `min(calc(var(--spacing) * ${Math.max(1, count - 1) * 2}), calc(100dvh - 18rem), calc(100% - 2rem))`;

/** Resting horizontal rail length: three spacing units per gap. */
export const railWidth = (count: number) =>
  `min(calc(var(--spacing) * ${Math.max(1, count - 1) * 3}), calc(100vw - 6rem))`;

/** Scale of a tick by its distance from the hovered one. */
export const tickScale = (distance: number | null, horizontal: boolean) => {
  if (horizontal) {
    return distance === 0
      ? "scale-y-100 bg-muted-foreground-1"
      : distance === 1
        ? "scale-y-[0.75]"
        : "scale-y-[0.625]";
  }
  return distance === 0
    ? "scale-x-100 bg-muted-foreground-1"
    : distance === 1
      ? "scale-x-[0.667]"
      : distance === 2
        ? "scale-x-[0.417]"
        : "scale-x-[0.333]";
};

const inPreview = (target: EventTarget | null) =>
  target instanceof Element &&
  target.closest("[data-minimap-preview]") !== null;
const inRail = (target: EventTarget | null) =>
  target instanceof Element && target.closest("[data-minimap-rail]") !== null;
const inMinimap = (target: EventTarget | null) =>
  inPreview(target) || inRail(target);

type Span = { start: number; size: number };
type Grown = Span & { shift: number };

export type MinimapProps<T extends { id: string }> = {
  items: readonly T[];
  /** Tick elements by item id, so the owner can mark the ones in view. */
  tickMap: Map<string, HTMLElement>;
  /** Always visible instead of on hover. */
  persistent?: boolean;
  /** "pointer" shows the rail only for a fine pointer from md up. */
  reveal?: "pointer" | "always";
  compact?: boolean;
  orientation?: "vertical" | "horizontal";
  /** Fewer items than this render nothing. */
  minItems?: number;
  /** Width (or height, horizontal) of the rail's hit area; 0 disables it. */
  hitStripWidth: number;
  label: (item: T | null) => string;
  renderPreview: (item: T, index: number) => ReactNode;
  onSelect: (item: T) => void;
};

/**
 * shared/minimap: a rail of ticks, one per item. Hovering previews the
 * nearest item, clicking jumps to it; on touch the rail grows while pressed
 * and selects on release.
 */
export function Minimap<T extends { id: string }>({
  items,
  tickMap,
  persistent = false,
  reveal = "always",
  compact = false,
  orientation = "vertical",
  minItems = 2,
  hitStripWidth,
  label,
  renderPreview,
  onSelect,
}: MinimapProps<T>) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [shownIndex, setShownIndex] = useState<number | null>(null);
  const [root, setRoot] = useState<HTMLDivElement | null>(null);
  const [grown, setGrown] = useState<Grown | null>(null);
  const capture = useRef<number | null>(null);
  const grownSpan = useRef<Span | null>(null);
  const pendingIndex = useRef<number | null>(null);
  const pointerType = useRef<string | null>(null);

  const active =
    hoverIndex !== null && hoverIndex < items.length ? hoverIndex : null;
  const activeItem = active === null ? null : (items[active] ?? null);
  if (active !== null && shownIndex !== active) setShownIndex(active);
  const previewIndex = active ?? shownIndex;
  const previewItem =
    previewIndex === null ? null : (items[previewIndex] ?? null);
  const previewTop =
    previewIndex === null ? 0 : tickPercent(previewIndex, items.length);
  const horizontal = orientation === "horizontal";

  const spanOf = (rect: DOMRect): Span =>
    horizontal
      ? { start: rect.left, size: rect.width }
      : { start: rect.top, size: rect.height };
  const pointerOf = (event: { clientX: number; clientY: number }) =>
    horizontal ? event.clientX : event.clientY;
  const railOf = (event: { currentTarget: HTMLElement }) =>
    event.currentTarget.parentElement ?? event.currentTarget;

  const indexAt = (
    event: { currentTarget: HTMLElement } & {
      clientX: number;
      clientY: number;
    },
  ) => {
    const span =
      grownSpan.current ?? spanOf(railOf(event).getBoundingClientRect());
    return tickAtPointer({
      itemCount: items.length,
      railStart: span.start,
      railSize: span.size,
      pointer: pointerOf(event),
    });
  };

  const grow = (event: PointerEvent<HTMLElement>): Grown => {
    const span = spanOf(railOf(event).getBoundingClientRect());
    const t =
      span.size <= 0
        ? 0.5
        : Math.max(0, Math.min(1, (pointerOf(event) - span.start) / span.size));
    const rem = Number.parseFloat(
      getComputedStyle(document.documentElement).fontSize,
    );
    const viewport = horizontal
      ? document.documentElement.clientWidth
      : document.documentElement.clientHeight;
    const room =
      viewport - (horizontal ? CHROME_HORIZONTAL : CHROME_VERTICAL) * rem;
    const at = span.start + t * span.size;
    const before = at - EDGE_MARGIN;
    const after = viewport - EDGE_MARGIN - at;
    const fit = Math.min(
      t > 0 ? before / t : Number.POSITIVE_INFINITY,
      t < 1 ? after / (1 - t) : Number.POSITIVE_INFINITY,
    );
    const size = Math.max(
      span.size,
      Math.min(
        span.size * (horizontal ? GROW_HORIZONTAL : GROW_VERTICAL),
        room,
        fit,
      ),
    );
    const start = at - t * size;
    return {
      start,
      size,
      shift: start - (span.start + span.size / 2 - size / 2),
    };
  };

  const selectionOutside = () => {
    const anchor = document.getSelection()?.anchorNode;
    return anchor == null || root === null || !root.contains(anchor);
  };

  if (items.length < minItems) return null;

  const isMouse = () =>
    pointerType.current === null || pointerType.current === "mouse";
  const leave = (event: MouseEvent | FocusEvent) => {
    if (!inMinimap(event.relatedTarget)) setHoverIndex(null);
  };
  const leaveRail = (event: MouseEvent | FocusEvent) => {
    if (!inPreview(event.relatedTarget)) setHoverIndex(null);
  };

  const onPointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    pointerType.current = event.pointerType;
    if (event.pointerType === "mouse") return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    capture.current = event.pointerId;
    const next = grow(event);
    grownSpan.current = next;
    pendingIndex.current = indexAt(event);
    setGrown(next);
    setHoverIndex(pendingIndex.current);
  };

  const onPointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    pointerType.current = event.pointerType;
    if (capture.current !== event.pointerId) return;
    pendingIndex.current = indexAt(event);
    setHoverIndex(pendingIndex.current);
  };

  const onPointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    if (capture.current !== event.pointerId) return;
    capture.current = null;
    grownSpan.current = null;
    setGrown(null);
    const index = pendingIndex.current;
    const item = index === null ? null : (items[index] ?? null);
    setHoverIndex(null);
    setShownIndex(null);
    if (item != null) onSelect(item);
  };

  const onPointerCancel = (event: PointerEvent<HTMLButtonElement>) => {
    if (capture.current !== event.pointerId) return;
    capture.current = null;
    grownSpan.current = null;
    setGrown(null);
    setHoverIndex(null);
    setShownIndex(null);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const next = horizontal ? "ArrowRight" : "ArrowDown";
    const prev = horizontal ? "ArrowLeft" : "ArrowUp";
    if (event.key === next || event.key === prev) {
      event.preventDefault();
      const step = event.key === next ? 1 : -1;
      setHoverIndex((index) =>
        Math.max(0, Math.min(items.length - 1, (index ?? 0) + step)),
      );
    } else if (event.key === "Home") {
      event.preventDefault();
      setHoverIndex(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setHoverIndex(items.length - 1);
    } else if (
      (event.key === "Enter" || event.key === " ") &&
      activeItem !== null
    ) {
      event.preventDefault();
      onSelect(activeItem);
    }
  };

  return (
    <div
      ref={setRoot}
      className={cx(
        "pointer-events-none absolute z-(--z-top-bar)",
        horizontal
          ? "inset-x-0 bottom-0 h-11"
          : cx("inset-y-0 left-0", compact ? "w-9" : "w-18"),
        reveal === "pointer"
          ? "hidden [@media(pointer:fine)]:md:block"
          : "block",
        persistent
          ? "opacity-100"
          : "opacity-0 transition-opacity duration-fast hover:opacity-100 focus-within:opacity-100",
      )}
    >
      <div className="relative h-full w-full select-none">
        <div
          className={cx(
            "pointer-events-none absolute transition-[height,width,translate] duration-fast ease-out-quint motion-reduce:transition-none",
            horizontal
              ? "top-1/2 left-1/2 h-0 -translate-x-1/2 -translate-y-1/2"
              : cx(
                  "top-1/2 w-0 -translate-y-1/2",
                  compact ? "left-2" : "left-3",
                ),
          )}
          style={
            horizontal
              ? {
                  width:
                    grown === null
                      ? railWidth(items.length)
                      : `${grown.size}px`,
                  translate:
                    grown === null
                      ? undefined
                      : `calc(-50% + ${grown.shift}px) -50%`,
                }
              : {
                  height:
                    grown === null
                      ? railHeight(items.length)
                      : `${grown.size}px`,
                  translate:
                    grown === null
                      ? undefined
                      : `0 calc(-50% + ${grown.shift}px)`,
                }
          }
        >
          {activeItem !== null && !horizontal && (
            // biome-ignore lint/a11y/noStaticElementInteractions: hover bridge between rail and preview, as in Capy
            <div
              data-minimap-preview
              className="pointer-events-auto absolute inset-y-0 left-0 w-8"
              onMouseLeave={leave}
            />
          )}
          <button
            data-minimap-rail
            type="button"
            aria-label={label(activeItem)}
            className={cx(
              "absolute cursor-pointer touch-none bg-transparent focus-visible:outline-ring-inset",
              horizontal
                ? "inset-x-0 top-1/2 -translate-y-1/2 before:absolute before:inset-y-1 before:-inset-x-7 before:rounded-(--radius-card) before:bg-card before:shadow-card before:content-[''] before:transition-[inset] before:duration-fast before:ease-out-quint motion-reduce:before:transition-none"
                : "inset-y-0 left-0 pointer-coarse:before:absolute pointer-coarse:before:-inset-y-3 pointer-coarse:before:right-0 pointer-coarse:before:-left-2 pointer-coarse:before:content-['']",
              hitStripWidth > 0 ? "pointer-events-auto" : "pointer-events-none",
            )}
            style={
              horizontal ? { height: hitStripWidth } : { width: hitStripWidth }
            }
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerCancel}
            onMouseMove={(event) => {
              if (!isMouse()) return;
              if (event.buttons === 0) setHoverIndex(indexAt(event));
              else if (selectionOutside()) setHoverIndex(null);
            }}
            onMouseLeave={leaveRail}
            onFocus={() => setHoverIndex((index) => index ?? 0)}
            onBlur={leaveRail}
            onMouseDown={(event) => event.preventDefault()}
            onClick={(event) => {
              if (!isMouse()) return;
              const index = indexAt(event);
              const item = index === null ? null : (items[index] ?? null);
              if (item != null) onSelect(item);
              event.currentTarget.blur();
            }}
            onKeyDown={onKeyDown}
          >
            {items.map((item, index) => (
              <span
                key={item.id}
                aria-hidden="true"
                data-in-view="false"
                data-hinted="false"
                ref={(el) => {
                  if (el) tickMap.set(item.id, el);
                  else tickMap.delete(item.id);
                }}
                className={cx(
                  "ease-out-quint pointer-events-none absolute rounded-full bg-muted-foreground-3 transition-[background-color,scale] duration-fast motion-reduce:transition-none data-[in-view=true]:bg-foreground data-[hinted=true]:scale-100 data-[hinted=true]:bg-foreground",
                  horizontal
                    ? cx(
                        "top-1/2 h-4 w-0.5 origin-center -translate-x-1/2 -translate-y-1/2",
                        tickScale(
                          active === null ? null : Math.abs(index - active),
                          true,
                        ),
                      )
                    : cx(
                        "left-0 h-0.5 origin-left -translate-y-1/2",
                        compact ? "w-4" : "w-6",
                        tickScale(
                          active === null ? null : Math.abs(index - active),
                          false,
                        ),
                      ),
                )}
                style={
                  horizontal
                    ? { left: `${tickPercent(index, items.length)}%` }
                    : { top: `${tickPercent(index, items.length)}%` }
                }
              />
            ))}
          </button>
          {previewItem !== null && previewIndex !== null && (
            // biome-ignore lint/a11y/noStaticElementInteractions: hover preview keeps itself open, as in Capy
            <div
              data-minimap-preview
              data-closing={activeItem === null ? "" : undefined}
              className={cx(
                "pointer-events-auto absolute cursor-text select-text",
                horizontal
                  ? "bottom-full left-1/2 mb-4 w-[min(20rem,calc(100vw-2rem))] origin-bottom"
                  : "left-8 w-80 origin-left -translate-y-1/2 pointer-coarse:left-11",
                "transition-[opacity,scale] duration-fast ease-out-quint starting:opacity-0 motion-safe:starting:scale-[0.97]",
                "data-[closing]:pointer-events-none data-[closing]:opacity-0 data-[closing]:duration-exit motion-safe:data-[closing]:scale-[0.97]",
              )}
              style={
                horizontal
                  ? { translate: `calc(-50% - ${grown?.shift ?? 0}px) 0` }
                  : { top: `${previewTop}%` }
              }
              onTransitionEnd={(event) => {
                if (
                  event.target === event.currentTarget &&
                  activeItem === null
                ) {
                  setShownIndex(null);
                }
              }}
              onMouseEnter={(event) => {
                if (isMouse() && event.buttons !== 0 && selectionOutside()) {
                  setHoverIndex(null);
                }
              }}
              onMouseLeave={leave}
              onBlur={leave}
            >
              <div className="rounded-(--radius-card) border-hairline border-border-2 bg-popover p-3 text-left shadow-overlay">
                {renderPreview(previewItem, previewIndex)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
