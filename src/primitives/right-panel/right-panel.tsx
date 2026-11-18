import { cx } from "class-variance-authority";
import {
  type ComponentProps,
  type CSSProperties,
  createContext,
  type KeyboardEvent,
  type PointerEvent,
  use,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

export const RIGHT_PANEL_DEFAULT_WIDTH = 520;
export const RIGHT_PANEL_MIN_WIDTH = 320;
export const RIGHT_PANEL_CLOSE_THRESHOLD = RIGHT_PANEL_MIN_WIDTH / 2;
export const RIGHT_PANEL_FULLSCREEN_SLACK = 64;
export const RIGHT_PANEL_KEY_STEP = 8;
export const RIGHT_PANEL_KEY_STEP_LARGE = 32;
export const RIGHT_PANEL_MAIN_MIN_REM = 20;
export const RIGHT_PANEL_WIDTH_KEY = "capy:web:right-panel-width";

/**
 * Capy's dock is `min(its own width, 38% of the work area)`: measured live at
 * 1440, 1100, 1000, 900, 820 and 780, the panel came back 452, 323, 285, 247,
 * 217 and 201 px — 38% of the work area every time, never the 32.5rem default
 * once the area is narrow. The panel shrinks with the transcript instead of
 * holding a floor and squeezing it.
 */
const PANEL_WIDTH = "w-[min(var(--right-panel-width),38cqw)]";

export const clampRightPanelWidth = (width: number) =>
  Math.max(width, RIGHT_PANEL_MIN_WIDTH);

export const readStoredRightPanelWidth = (key: string) => {
  try {
    const raw = globalThis.localStorage.getItem(key);
    const width = raw === null ? Number.NaN : Number(raw);
    return Number.isFinite(width) ? width : RIGHT_PANEL_DEFAULT_WIDTH;
  } catch {
    return RIGHT_PANEL_DEFAULT_WIDTH;
  }
};

const setGroupWidth = (panel: HTMLElement, width: number) =>
  panel
    .closest<HTMLElement>("[data-slot=right-panel-group]")
    ?.style.setProperty("--right-panel-width", `${width}px`);

export const maxRightPanelWidth = (panel: HTMLElement) => {
  const rem =
    Number.parseFloat(getComputedStyle(document.documentElement).fontSize) ||
    16;
  const available = panel.parentElement?.clientWidth ?? window.innerWidth;
  return Math.max(
    RIGHT_PANEL_MIN_WIDTH,
    available - RIGHT_PANEL_MAIN_MIN_REM * rem,
  );
};

type RightPanelGroupValue = {
  width: number;
  setWidth: (width: number) => void;
};

const RightPanelGroupContext = createContext<RightPanelGroupValue | null>(null);

export function useRightPanelGroup() {
  return use(RightPanelGroupContext);
}

export type RightPanelGroupProps = ComponentProps<"div"> & {
  storageKey?: string | null;
};

export function RightPanelGroup({
  storageKey = RIGHT_PANEL_WIDTH_KEY,
  className,
  style,
  children,
  ...props
}: RightPanelGroupProps) {
  const [stored, setStored] = useState(() =>
    storageKey === null
      ? RIGHT_PANEL_DEFAULT_WIDTH
      : readStoredRightPanelWidth(storageKey),
  );
  const width = clampRightPanelWidth(stored);
  const setWidth = useCallback(
    (next: number) => {
      const clamped = clampRightPanelWidth(next);
      setStored(clamped);
      if (storageKey === null) return;
      try {
        globalThis.localStorage.setItem(storageKey, String(clamped));
      } catch {}
    },
    [storageKey],
  );
  return (
    <div
      data-slot="right-panel-group"
      className={cx("@container relative flex h-full min-h-0", className)}
      style={{ "--right-panel-width": `${width}px`, ...style } as CSSProperties}
      {...props}
    >
      <RightPanelGroupContext value={{ width, setWidth }}>
        {children}
      </RightPanelGroupContext>
    </div>
  );
}

export type RightPanelProps = ComponentProps<"aside"> & {
  open?: boolean;
  fullscreen?: boolean;
  onClose?: () => void;
  onFullscreen?: () => void;
};

export function RightPanel({
  open = true,
  fullscreen = false,
  onClose,
  onFullscreen,
  className,
  children,
  ...props
}: RightPanelProps) {
  if (use(RightPanelGroupContext) === null)
    throw TypeError("RightPanel rendered outside a RightPanelGroup");
  return (
    <aside
      data-slot="right-panel"
      data-state={open ? "open" : "closed"}
      className={cx(
        "ease-out-quint relative hidden shrink-0 flex-col overflow-hidden transition-[width] duration-base md:flex",
        "motion-reduce:transition-none",
        open
          ? fullscreen
            ? "w-[100cqw] border-l-0"
            : cx(PANEL_WIDTH, "border-l-hairline border-border-1")
          : "duration-fast w-0",
        className,
      )}
      {...props}
    >
      <RightPanelContent open={open} fullscreen={fullscreen}>
        {children}
      </RightPanelContent>
      <RightPanelRail
        open={open && !fullscreen}
        onClose={onClose}
        onFullscreen={onFullscreen}
      />
    </aside>
  );
}

export type RightPanelContentProps = ComponentProps<"div"> & {
  open?: boolean;
  fullscreen?: boolean;
};

export function RightPanelContent({
  open = true,
  fullscreen = false,
  className,
  ...props
}: RightPanelContentProps) {
  return (
    <div
      data-slot="right-panel-content"
      inert={!open || undefined}
      className={cx(
        "ease-out-quint flex h-full shrink-0 flex-col transition-[width,opacity,translate] duration-base",
        fullscreen ? "w-[100cqw]" : PANEL_WIDTH,
        open
          ? "[transition-delay:calc(var(--delay-stagger)*0),var(--delay-stagger),var(--delay-stagger)]"
          : "translate-x-4 opacity-0 delay-0 duration-exit",
        "motion-reduce:transition-[opacity] motion-reduce:translate-x-0 motion-reduce:delay-0 motion-reduce:duration-collapse",
        className,
      )}
      {...props}
    />
  );
}

type RailDrag = {
  pointerId: number;
  startX: number;
  startWidth: number;
  pendingWidth: number;
  moved: boolean;
  rafId: number | null;
  panel: HTMLElement;
  content: HTMLElement;
};

export type RightPanelRailProps = ComponentProps<"button"> & {
  open?: boolean;
  onClose?: () => void;
  onFullscreen?: () => void;
};

export function RightPanelRail({
  open = true,
  onClose,
  onFullscreen,
  className,
  ...props
}: RightPanelRailProps) {
  const group = use(RightPanelGroupContext);
  if (group === null)
    throw TypeError("RightPanelRail rendered outside a RightPanelGroup");
  const { width, setWidth } = group;
  const drag = useRef<RailDrag | null>(null);
  const widthRef = useRef(width);
  widthRef.current = width;

  const finish = useCallback(
    (commit: boolean) => {
      const current = drag.current;
      if (!current) return;
      drag.current = null;
      if (current.rafId !== null) cancelAnimationFrame(current.rafId);
      current.panel.style.removeProperty("transition-duration");
      current.content.style.removeProperty("transition-duration");
      document.body.style.removeProperty("cursor");
      document.body.style.removeProperty("user-select");
      if (commit && current.moved) setWidth(current.pendingWidth);
      else setGroupWidth(current.panel, widthRef.current);
    },
    [setWidth],
  );
  useEffect(() => () => finish(false), [finish]);

  const release = (event: PointerEvent<HTMLButtonElement>, id: number) => {
    if (event.currentTarget.hasPointerCapture(id))
      event.currentTarget.releasePointerCapture(id);
  };

  const onPointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;
    const panel = event.currentTarget.closest<HTMLElement>(
      "[data-slot=right-panel]",
    );
    const content = panel?.querySelector<HTMLElement>(
      '[data-slot="right-panel-content"]',
    );
    if (!panel || !content) return;
    event.preventDefault();
    const start = clampRightPanelWidth(panel.getBoundingClientRect().width);
    panel.style.setProperty("transition-duration", "initial");
    content.style.setProperty("transition-duration", "initial");
    drag.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startWidth: start,
      pendingWidth: start,
      moved: false,
      rafId: null,
      panel,
      content,
    };
    setGroupWidth(panel, start);
    event.currentTarget.setPointerCapture(event.pointerId);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  const onPointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    const current = drag.current;
    if (!current || event.pointerId !== current.pointerId) return;
    const next = current.startWidth + current.startX - event.clientX;
    if (Math.abs(event.clientX - current.startX) > 2) current.moved = true;
    if (next < RIGHT_PANEL_CLOSE_THRESHOLD && onClose !== undefined) {
      release(event, current.pointerId);
      finish(false);
      onClose();
      return;
    }
    const max = maxRightPanelWidth(current.panel);
    if (next > max + RIGHT_PANEL_FULLSCREEN_SLACK && onFullscreen) {
      release(event, current.pointerId);
      finish(false);
      onFullscreen();
      return;
    }
    current.pendingWidth = Math.min(clampRightPanelWidth(next), max);
    if (current.rafId !== null) return;
    current.rafId = requestAnimationFrame(() => {
      const live = drag.current;
      if (!live) return;
      live.rafId = null;
      setGroupWidth(live.panel, live.pendingWidth);
    });
  };

  const onPointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    const current = drag.current;
    if (!current || event.pointerId !== current.pointerId) return;
    release(event, current.pointerId);
    finish(true);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const step = event.shiftKey
      ? RIGHT_PANEL_KEY_STEP_LARGE
      : RIGHT_PANEL_KEY_STEP;
    const direction = event.key === "ArrowLeft" ? 1 : -1;
    setWidth(widthRef.current + step * direction);
  };

  return (
    <button
      type="button"
      aria-label="Resize panel"
      data-slot="right-panel-rail"
      tabIndex={open ? 0 : -1}
      className={cx(
        "absolute inset-y-0 left-0 w-2 cursor-col-resize touch-none outline-none",
        "after:absolute after:inset-y-0 after:left-0 after:w-0.5 after:rounded-full",
        "focus-visible:after:bg-(--ring)",
        !open && "pointer-events-none",
        className,
      )}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onLostPointerCapture={() => finish(true)}
      onDoubleClick={() => setWidth(RIGHT_PANEL_DEFAULT_WIDTH)}
      onKeyDown={onKeyDown}
      {...props}
    />
  );
}
