import { cx } from "class-variance-authority";
import {
  type CSSProperties,
  createContext,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  use,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  RightPanel,
  RightPanelContent,
  RightPanelGroup,
  RightPanelRail,
} from "@/primitives/right-panel";

export const RIGHT_PANEL_DEFAULT_WIDTH = 520;
export const RIGHT_PANEL_MIN_WIDTH = 320;
export const RIGHT_PANEL_CLOSE_THRESHOLD = RIGHT_PANEL_MIN_WIDTH / 2;
export const RIGHT_PANEL_FULLSCREEN_SLACK = 64;
export const RIGHT_PANEL_KEY_STEP = 8;
export const RIGHT_PANEL_KEY_STEP_LARGE = 32;
export const RIGHT_PANEL_MAIN_MIN_REM = 20;
export const RIGHT_PANEL_WIDTH_KEY = "capy:web:right-panel-width";

const NO_TRANSITION = "calc(var(--duration-fast) * 0)";

const PANEL_WIDTH =
  "w-[clamp(20rem,var(--right-panel-width,32.5rem),calc(100cqw-20rem))]";

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

const writeStoredRightPanelWidth = (key: string, width: number) => {
  try {
    globalThis.localStorage.setItem(key, String(width));
  } catch {}
};

type RightPanelWidth = { width: number; setWidth: (width: number) => void };

const RightPanelWidthContext = createContext<RightPanelWidth | null>(null);

export type RightPanelHostProps = {
  children: ReactNode;
  storageKey?: string | null;
};

export function RightPanelHost({
  children,
  storageKey = RIGHT_PANEL_WIDTH_KEY,
}: RightPanelHostProps) {
  const [stored, setStored] = useState(() =>
    storageKey === null
      ? RIGHT_PANEL_DEFAULT_WIDTH
      : readStoredRightPanelWidth(storageKey),
  );
  const width = clampRightPanelWidth(stored);
  const setWidth = (next: number) => {
    const clamped = clampRightPanelWidth(next);
    setStored(clamped);
    if (storageKey !== null) writeStoredRightPanelWidth(storageKey, clamped);
  };
  return (
    <RightPanelGroup
      className="@container relative flex h-full min-h-0"
      style={{ "--right-panel-width": `${width}px` } as CSSProperties}
    >
      <RightPanelWidthContext value={{ width, setWidth }}>
        {children}
      </RightPanelWidthContext>
    </RightPanelGroup>
  );
}

export type RightPanelHostPanelProps = {
  open?: boolean;
  fullscreen?: boolean;
  onClose?: () => void;
  onFullscreen?: () => void;
  className?: string;
  children?: ReactNode;
};

export function RightPanelHostPanel({
  open = true,
  fullscreen = false,
  onClose,
  onFullscreen,
  className,
  children,
}: RightPanelHostPanelProps) {
  const context = use(RightPanelWidthContext);
  if (context === null)
    throw new TypeError("RightPanel rendered outside a RightPanelGroup");
  return (
    <RightPanel
      data-state={open ? "open" : "closed"}
      className={cx(
        "ease-out-quint relative hidden shrink-0 flex-col overflow-hidden transition-[width] md:flex",
        "motion-reduce:transition-none",
        open
          ? fullscreen
            ? "w-[100cqw] border-l-0 duration-base"
            : cx(
                PANEL_WIDTH,
                "border-l-[length:calc(var(--spacing)*0.125)] border-border-1 duration-base",
              )
          : "w-0 duration-fast",
        className,
      )}
    >
      <RightPanelContent
        inert={!open || undefined}
        className={cx(
          "ease-out-quint flex h-full shrink-0 flex-col transition-[width,opacity,translate] duration-base",
          fullscreen ? "w-[100cqw]" : PANEL_WIDTH,
          open
            ? "[transition-delay:calc(var(--delay-stagger)*0),var(--delay-stagger),var(--delay-stagger)]"
            : "translate-x-4 opacity-0 delay-0 duration-exit",
          "motion-reduce:transition-[opacity] motion-reduce:translate-x-0 motion-reduce:delay-0 motion-reduce:duration-collapse",
        )}
      >
        {children}
      </RightPanelContent>
      <RightPanelResizeRail
        open={open && !fullscreen}
        width={context.width}
        setWidth={context.setWidth}
        onClose={onClose}
        onFullscreen={onFullscreen}
      />
    </RightPanel>
  );
}

const setGroupWidth = (el: HTMLElement, width: number) =>
  el
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

type DragState = {
  pointerId: number;
  startX: number;
  startWidth: number;
  pendingWidth: number;
  moved: boolean;
  rafId: number | null;
  panel: HTMLElement;
  content: HTMLElement;
};

type RailProps = RightPanelWidth & {
  open: boolean;
  onClose?: () => void;
  onFullscreen?: () => void;
};

function RightPanelResizeRail({
  open,
  width,
  setWidth,
  onClose,
  onFullscreen,
}: RailProps) {
  const drag = useRef<DragState | null>(null);
  const widthRef = useRef(width);
  widthRef.current = width;

  const finish = (commit: boolean) => {
    const state = drag.current;
    if (!state) return;
    drag.current = null;
    if (state.rafId !== null) cancelAnimationFrame(state.rafId);
    state.panel.style.removeProperty("transition-duration");
    state.content.style.removeProperty("transition-duration");
    document.body.style.removeProperty("cursor");
    document.body.style.removeProperty("user-select");
    if (commit && state.moved) setWidth(state.pendingWidth);
    else setGroupWidth(state.panel, widthRef.current);
  };
  const finishRef = useRef(finish);
  finishRef.current = finish;
  useEffect(() => () => finishRef.current(false), []);

  const onPointerDown = (event: PointerEvent<HTMLElement>) => {
    if (event.button !== 0) return;
    const panel = event.currentTarget.closest<HTMLElement>(
      "[data-slot=right-panel]",
    );
    const content = panel?.querySelector<HTMLElement>(
      "[data-slot=right-panel-content]",
    );
    if (!panel || !content) return;
    event.preventDefault();
    const start = clampRightPanelWidth(panel.getBoundingClientRect().width);
    panel.style.setProperty("transition-duration", NO_TRANSITION);
    content.style.setProperty("transition-duration", NO_TRANSITION);
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

  const release = (event: PointerEvent<HTMLElement>, pointerId: number) => {
    if (event.currentTarget.hasPointerCapture(pointerId))
      event.currentTarget.releasePointerCapture(pointerId);
  };

  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    const state = drag.current;
    if (!state || event.pointerId !== state.pointerId) return;
    const next = state.startWidth + (state.startX - event.clientX);
    if (Math.abs(event.clientX - state.startX) > 2) state.moved = true;
    if (next < RIGHT_PANEL_CLOSE_THRESHOLD && onClose) {
      release(event, state.pointerId);
      finish(false);
      onClose();
      return;
    }
    const max = maxRightPanelWidth(state.panel);
    if (next > max + RIGHT_PANEL_FULLSCREEN_SLACK && onFullscreen) {
      release(event, state.pointerId);
      finish(false);
      onFullscreen();
      return;
    }
    state.pendingWidth = Math.min(clampRightPanelWidth(next), max);
    if (state.rafId !== null) return;
    state.rafId = requestAnimationFrame(() => {
      const current = drag.current;
      if (!current) return;
      current.rafId = null;
      setGroupWidth(current.panel, current.pendingWidth);
    });
  };

  const onPointerUp = (event: PointerEvent<HTMLElement>) => {
    const state = drag.current;
    if (!state || event.pointerId !== state.pointerId) return;
    release(event, state.pointerId);
    finish(true);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const step = event.shiftKey
      ? RIGHT_PANEL_KEY_STEP_LARGE
      : RIGHT_PANEL_KEY_STEP;
    setWidth(widthRef.current + step * (event.key === "ArrowLeft" ? 1 : -1));
  };

  return (
    <RightPanelRail
      data-track-owner="ui/right-panel.tsx#RightPanelRail:button[Resize panel]"
      role="button"
      aria-label="Resize panel"
      tabIndex={open ? 0 : -1}
      className={cx(
        "absolute inset-y-0 left-0 w-2 cursor-col-resize touch-none outline-none",
        "after:absolute after:inset-y-0 after:left-0 after:w-0.5 after:rounded-full",
        "focus-visible:after:bg-(--ring)",
        !open && "pointer-events-none",
      )}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onLostPointerCapture={() => finish(true)}
      onDoubleClick={() => setWidth(RIGHT_PANEL_DEFAULT_WIDTH)}
      onKeyDown={onKeyDown}
    />
  );
}
