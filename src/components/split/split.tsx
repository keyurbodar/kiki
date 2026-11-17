import { cx } from "class-variance-authority";
import {
  Children,
  type ComponentProps,
  type KeyboardEvent,
  type PointerEvent,
  useEffect,
  useRef,
  useState,
} from "react";

export const SPLIT_KEY_STEP = 16;
export const SPLIT_KEY_STEP_LARGE = 48;
export const SPLIT_MAX_SHARE = 0.7;

export const clampSplitSize = (
  size: number,
  min: number,
  max: number,
  containerWidth: number,
) => {
  const cap =
    containerWidth > 0
      ? Math.min(max, Math.floor(containerWidth * SPLIT_MAX_SHARE))
      : max;
  return Math.min(Math.max(size, min), Math.max(min, cap));
};

export type SplitProps = ComponentProps<"div"> & {
  defaultSize?: number;
  size?: number;
  onSizeChange?: (size: number) => void;
  minSize?: number;
  maxSize?: number;
  edge?: "start" | "end";
  handleLabel?: string;
  handleClassName?: string;
  startClassName?: string;
  endClassName?: string;
};

type DragState = {
  pointerId: number;
  startX: number;
  startSize: number;
  pendingSize: number;
  rafId: number | null;
  pane: HTMLElement;
  panes: HTMLElement[];
};

export function Split({
  defaultSize,
  size,
  onSizeChange,
  minSize = 0,
  maxSize = Number.POSITIVE_INFINITY,
  edge = "start",
  handleLabel = "Resize",
  handleClassName,
  startClassName,
  endClassName,
  className,
  children,
  ...props
}: SplitProps) {
  const [ownSize, setOwnSize] = useState(defaultSize ?? minSize);
  const current = size ?? ownSize;
  const setSize = (next: number | ((prev: number) => number)) => {
    const value = typeof next === "function" ? next(current) : next;
    setOwnSize(value);
    onSizeChange?.(value);
  };
  const drag = useRef<DragState | null>(null);
  const sizedStart = edge === "start";
  const [start, end] = Children.toArray(children);

  const finish = (commit: boolean) => {
    const state = drag.current;
    if (!state) return;
    drag.current = null;
    if (state.rafId !== null) cancelAnimationFrame(state.rafId);
    document.body.style.removeProperty("cursor");
    document.body.style.removeProperty("user-select");
    for (const pane of state.panes) pane.style.removeProperty("pointer-events");
    if (commit) setSize(state.pendingSize);
    else state.pane.style.width = `${state.startSize}px`;
  };
  const finishRef = useRef(finish);
  finishRef.current = finish;
  useEffect(() => () => finishRef.current(false), []);

  const onPointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;
    const handle = event.currentTarget;
    const pane = sizedStart
      ? handle.previousElementSibling
      : handle.nextElementSibling;
    const parent = handle.parentElement;
    if (!(pane instanceof HTMLElement) || parent === null) return;
    const panes = [
      handle.previousElementSibling,
      handle.nextElementSibling,
    ].filter((el): el is HTMLElement => el instanceof HTMLElement);
    event.preventDefault();
    const width = clampSplitSize(
      pane.getBoundingClientRect().width,
      minSize,
      maxSize,
      parent.clientWidth,
    );
    drag.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startSize: width,
      pendingSize: width,
      rafId: null,
      pane,
      panes,
    };
    pane.style.width = `${width}px`;
    for (const el of panes) el.style.pointerEvents = "none";
    handle.setPointerCapture(event.pointerId);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  const onPointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    const state = drag.current;
    if (!state || event.pointerId !== state.pointerId) return;
    const delta = sizedStart
      ? event.clientX - state.startX
      : state.startX - event.clientX;
    state.pendingSize = clampSplitSize(
      state.startSize + delta,
      minSize,
      maxSize,
      event.currentTarget.parentElement?.clientWidth ?? 0,
    );
    if (state.rafId !== null) return;
    state.rafId = requestAnimationFrame(() => {
      const latest = drag.current;
      if (!latest) return;
      latest.rafId = null;
      latest.pane.style.width = `${latest.pendingSize}px`;
    });
  };

  const onPointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    const state = drag.current;
    if (!state || event.pointerId !== state.pointerId) return;
    if (event.currentTarget.hasPointerCapture(state.pointerId))
      event.currentTarget.releasePointerCapture(state.pointerId);
    finish(true);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const containerWidth = event.currentTarget.parentElement?.clientWidth ?? 0;
    const step = event.shiftKey ? SPLIT_KEY_STEP_LARGE : SPLIT_KEY_STEP;
    const direction = event.key === "ArrowRight" ? 1 : -1;
    const signed = sizedStart ? direction : -direction;
    setSize((prev) =>
      clampSplitSize(prev + step * signed, minSize, maxSize, containerWidth),
    );
  };

  const sizedPane = "max-md:min-w-0 max-md:flex-1 max-md:!w-auto md:shrink-0";
  const fluidPane = "min-w-0 flex-1";

  return (
    <div className={cx("flex min-h-0 min-w-0 flex-1", className)} {...props}>
      <div
        className={cx(
          "flex min-h-0 flex-col overflow-hidden",
          sizedStart ? sizedPane : fluidPane,
          startClassName,
        )}
        style={sizedStart ? { width: current } : undefined}
      >
        {start}
      </div>
      <button
        data-track-owner="shared/split.tsx#SideSplit:button.1"
        type="button"
        aria-label={handleLabel}
        className={cx(
          "relative -mx-1 w-2 shrink-0 cursor-col-resize touch-none outline-none after:absolute after:inset-y-0 after:left-1/2 after:w-0.5 after:-translate-x-1/2 after:rounded-full focus-visible:after:bg-(--ring)",
          handleClassName,
        )}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onLostPointerCapture={() => finish(true)}
        onDoubleClick={() => setSize(defaultSize ?? minSize)}
        onKeyDown={onKeyDown}
      />
      <div
        className={cx(
          "flex min-h-0 flex-col overflow-hidden",
          sizedStart ? fluidPane : sizedPane,
          endClassName,
        )}
        style={sizedStart ? undefined : { width: current }}
      >
        {end}
      </div>
    </div>
  );
}

export type TileDividerProps = ComponentProps<"button"> & {
  sideBySide?: boolean;
  dragging?: boolean;
};

export function TileDivider({
  sideBySide = true,
  dragging = false,
  className,
  ...props
}: TileDividerProps) {
  return (
    <button
      type="button"
      data-track-owner="features/thread/pane/tile-surface.tsx#TileDivider:button.1"
      data-slot="tile-divider"
      aria-label={
        sideBySide ? "Resize panes side by side" : "Resize stacked panes"
      }
      data-dragging={dragging ? "" : undefined}
      className={cx(
        "absolute touch-none outline-none focus-visible:outline-ring-inset",
        "before:absolute before:rounded-full before:bg-(--ring) before:opacity-0 before:transition-opacity before:duration-fast before:ease-out-quint",
        "hover:before:opacity-100 hover:before:delay-hover-intent focus-visible:before:opacity-100 data-dragging:before:opacity-100 data-dragging:before:delay-0 motion-reduce:before:transition-none",
        "pointer-coarse:after:absolute pointer-coarse:after:top-1/2 pointer-coarse:after:left-1/2 pointer-coarse:after:-translate-x-1/2 pointer-coarse:after:-translate-y-1/2",
        sideBySide
          ? "inset-y-0 -left-1 w-2 cursor-col-resize before:inset-y-0 before:left-[calc(var(--spacing)*0.625)] before:w-[calc(var(--spacing)*0.75)] pointer-coarse:after:h-full pointer-coarse:after:w-11"
          : "inset-x-0 -top-1 h-2 cursor-row-resize before:inset-x-0 before:top-[calc(var(--spacing)*0.625)] before:h-[calc(var(--spacing)*0.75)] pointer-coarse:after:h-11 pointer-coarse:after:w-full",
        className,
      )}
      {...props}
    />
  );
}

export type TileDropPreviewProps = ComponentProps<"div">;

export function TileDropPreview(props: TileDropPreviewProps) {
  return <div data-slot="tile-drop-preview" {...props} />;
}
