import { cx } from "class-variance-authority";
import {
  type ComponentProps,
  type CSSProperties,
  createContext,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";

export const SIDEBAR_DEFAULT_WIDTH = 240;
export const SIDEBAR_MIN_WIDTH = 224;
export const SIDEBAR_MAX_WIDTH = 330;
export const SIDEBAR_COLLAPSE_THRESHOLD = SIDEBAR_MIN_WIDTH / 2;
export const SIDEBAR_KEY_STEP = 8;
export const SIDEBAR_KEY_STEP_LARGE = 32;
export const SIDEBAR_WIDTH_KEY = "capy:web:sidebar-width";
export const SIDEBAR_OPEN_KEY = "capy:web:sidebar-open";

export const clampSidebarWidth = (width: number) =>
  Math.min(Math.max(width, SIDEBAR_MIN_WIDTH), SIDEBAR_MAX_WIDTH);

const readStorage = (key: string) => {
  try {
    return globalThis.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const writeStorage = (key: string, value: string) => {
  try {
    globalThis.localStorage.setItem(key, value);
  } catch {}
};

export const readStoredSidebarOpen = () => {
  const raw = readStorage(SIDEBAR_OPEN_KEY);
  return raw === null ? null : raw === "true";
};

export const readStoredSidebarWidth = () => {
  const raw = readStorage(SIDEBAR_WIDTH_KEY);
  const width = raw === null ? Number.NaN : Number(raw);
  return Number.isFinite(width) ? width : null;
};

let narrowQuery: MediaQueryList | null | undefined;

const getNarrowQuery = () => {
  if (narrowQuery !== undefined) return narrowQuery;
  const md =
    typeof window === "undefined" || typeof window.matchMedia !== "function"
      ? ""
      : getComputedStyle(document.documentElement)
          .getPropertyValue("--breakpoint-md")
          .trim();
  narrowQuery = md === "" ? null : window.matchMedia(`(width < ${md})`);
  return narrowQuery;
};

const subscribeNarrow = (onChange: () => void) => {
  const query = getNarrowQuery();
  query?.addEventListener("change", onChange);
  return () => query?.removeEventListener("change", onChange);
};

export const isNarrowViewport = () => getNarrowQuery()?.matches ?? false;

const getServerNarrow = () => false;

export function useIsNarrow() {
  return useSyncExternalStore(
    subscribeNarrow,
    isNarrowViewport,
    getServerNarrow,
  );
}

export type SidebarState = { open: boolean; isNarrow: boolean; width: number };

export type SidebarActions = {
  setOpen: (open: boolean) => void;
  setOpenMobile: (open: boolean | ((open: boolean) => boolean)) => void;
  toggle: () => void;
  setWidth: (width: number) => void;
};

const SidebarStateContext = createContext<SidebarState | null>(null);
const SidebarOpenMobileContext = createContext<boolean | null>(null);
const SidebarActionsContext = createContext<SidebarActions | null>(null);

export function useSidebarState() {
  const state = useContext(SidebarStateContext);
  if (!state) throw TypeError("useSidebarState must be inside SidebarProvider");
  return state;
}

/** Sidebar state, or null when rendered outside a SidebarProvider. */
export function useSidebarStateOptional() {
  return useContext(SidebarStateContext);
}

export function useSidebarOpenMobile() {
  const open = useContext(SidebarOpenMobileContext);
  if (open === null)
    throw TypeError("useSidebarOpenMobile must be inside SidebarProvider");
  return open;
}

export function useSidebarActions() {
  const actions = useContext(SidebarActionsContext);
  if (!actions)
    throw TypeError("useSidebarActions must be inside SidebarProvider");
  return actions;
}

const staticState: SidebarState = {
  open: true,
  isNarrow: false,
  width: SIDEBAR_DEFAULT_WIDTH,
};

const staticActions: SidebarActions = {
  setOpen: () => {},
  setOpenMobile: () => {},
  toggle: () => {},
  setWidth: () => {},
};

export function StaticSidebarProvider({ children }: { children: ReactNode }) {
  return (
    <SidebarStateContext.Provider value={staticState}>
      <SidebarOpenMobileContext.Provider value={false}>
        <SidebarActionsContext.Provider value={staticActions}>
          {children}
        </SidebarActionsContext.Provider>
      </SidebarOpenMobileContext.Provider>
    </SidebarStateContext.Provider>
  );
}

const toggleOpen = (open: boolean) => {
  const next = !open;
  writeStorage(SIDEBAR_OPEN_KEY, String(next));
  return next;
};

export type SidebarWrapperProps = ComponentProps<"div">;

export function SidebarWrapper({ className, ...props }: SidebarWrapperProps) {
  return (
    <div
      data-slot="sidebar-wrapper"
      className={cx(
        "flex h-dvh w-full overflow-hidden bg-chrome pt-(--safe-top) max-md:bg-panel",
        className,
      )}
      {...props}
    />
  );
}

export type SidebarProviderProps = SidebarWrapperProps;

export function SidebarProvider({ style, ...props }: SidebarProviderProps) {
  const isNarrow = useIsNarrow();
  const [open, setOpenState] = useState(true);
  const [openMobile, setOpenMobile] = useState(false);
  const [width, setWidthState] = useState(SIDEBAR_DEFAULT_WIDTH);
  if (!isNarrow && openMobile) setOpenMobile(false);

  useLayoutEffect(() => {
    const storedWidth = readStoredSidebarWidth();
    if (storedWidth !== null) setWidthState(clampSidebarWidth(storedWidth));
    const storedOpen = readStoredSidebarOpen();
    if (storedOpen !== null) setOpenState(storedOpen);
  }, []);

  const [actions] = useState<SidebarActions>(() => ({
    setOpen: (next) => {
      setOpenState(next);
      writeStorage(SIDEBAR_OPEN_KEY, String(next));
    },
    setOpenMobile,
    toggle: () => {
      if (isNarrowViewport()) setOpenMobile((value) => !value);
      else setOpenState(toggleOpen);
    },
    setWidth: (next) => {
      const clamped = clampSidebarWidth(next);
      setWidthState(clamped);
      document.documentElement.style.setProperty(
        "--sidebar-width-user",
        `${clamped}px`,
      );
      writeStorage(SIDEBAR_WIDTH_KEY, String(clamped));
    },
  }));

  return (
    <SidebarStateContext.Provider value={{ open, isNarrow, width }}>
      <SidebarOpenMobileContext.Provider value={openMobile}>
        <SidebarActionsContext.Provider value={actions}>
          <SidebarWrapper
            style={
              {
                "--sidebar-width": `var(--sidebar-width-user, ${width}px)`,
                ...style,
              } as CSSProperties
            }
            {...props}
          />
        </SidebarActionsContext.Provider>
      </SidebarOpenMobileContext.Provider>
    </SidebarStateContext.Provider>
  );
}

export type SidebarProps = { children?: ReactNode };

export function Sidebar({ children }: SidebarProps) {
  return (
    <>
      <SidebarGap />
      <SidebarContainer>
        <SidebarContent>{children}</SidebarContent>
        <SidebarRail />
      </SidebarContainer>
    </>
  );
}

export type SidebarContainerProps = ComponentProps<"div">;

export function SidebarContainer({
  className,
  ...props
}: SidebarContainerProps) {
  const { open } = useSidebarState();
  return (
    <div
      data-slot="sidebar-container"
      className={cx(
        "ease-out-quint fixed top-(--shell-top) bottom-0 left-0 z-(--z-sidebar) flex w-(--sidebar-width) transition-[translate] duration-base max-md:hidden",
        !open && "-translate-x-full duration-fast",
        "motion-reduce:transition-none",
        className,
      )}
      {...props}
    />
  );
}

export type SidebarGapProps = ComponentProps<"div">;

export function SidebarGap({ className, ...props }: SidebarGapProps) {
  const { open } = useSidebarState();
  return (
    <div
      data-slot="sidebar-gap"
      className={cx(
        "ease-out-quint relative w-(--sidebar-width) shrink-0 transition-[width] duration-base max-md:hidden",
        !open && "w-0 duration-fast",
        "motion-reduce:transition-none",
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
  width: number;
  rafId: number | null;
  followers: HTMLElement[];
  suppressed: HTMLElement[];
};

const RAIL_FOLLOWERS =
  "[data-slot=sidebar-gap], [data-slot=sidebar-container], [data-slot=sidebar-panel], [data-slot=tab-controls]";

export type SidebarRailProps = ComponentProps<"button">;

export function SidebarRail({ className, ...props }: SidebarRailProps) {
  const { open } = useSidebarState();
  const actions = useSidebarActions();
  const drag = useRef<RailDrag | null>(null);

  const finish = (commit: boolean) => {
    const current = drag.current;
    if (!current) return;
    drag.current = null;
    if (current.rafId !== null) cancelAnimationFrame(current.rafId);
    if (commit) actions.setWidth(current.pendingWidth);
    for (const el of current.followers) el.style.removeProperty("width");
    for (const el of current.suppressed)
      el.style.removeProperty("transition-duration");
    document.body.style.removeProperty("cursor");
    document.body.style.removeProperty("user-select");
  };
  const finishRef = useRef(finish);
  finishRef.current = finish;
  useEffect(() => () => finishRef.current(false), []);

  const onPointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;
    const wrapper = event.currentTarget.closest("[data-slot=sidebar-wrapper]");
    const container = event.currentTarget.closest(
      "[data-slot=sidebar-container]",
    );
    if (!wrapper || !container) return;
    event.preventDefault();
    const width = clampSidebarWidth(container.getBoundingClientRect().width);
    const suppressed = [
      ...wrapper.querySelectorAll<HTMLElement>(RAIL_FOLLOWERS),
    ];
    for (const el of suppressed)
      el.style.setProperty("transition-duration", "initial");
    drag.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startWidth: width,
      pendingWidth: width,
      width,
      rafId: null,
      followers: suppressed.filter((el) => el.dataset.slot !== "sidebar-panel"),
      suppressed,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  const onPointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    const current = drag.current;
    if (!current || event.pointerId !== current.pointerId) return;
    const next = current.startWidth + event.clientX - current.startX;
    if (next < SIDEBAR_COLLAPSE_THRESHOLD) {
      if (event.currentTarget.hasPointerCapture(current.pointerId))
        event.currentTarget.releasePointerCapture(current.pointerId);
      finish(false);
      actions.setOpen(false);
      return;
    }
    current.pendingWidth = clampSidebarWidth(next);
    if (current.rafId !== null) return;
    current.rafId = requestAnimationFrame(() => {
      const live = drag.current;
      if (!live) return;
      live.rafId = null;
      for (const el of live.followers)
        el.style.width = `${live.pendingWidth}px`;
      live.width = live.pendingWidth;
    });
  };

  const onPointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    const current = drag.current;
    if (!current || event.pointerId !== current.pointerId) return;
    if (event.currentTarget.hasPointerCapture(current.pointerId))
      event.currentTarget.releasePointerCapture(current.pointerId);
    finish(true);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const step = event.shiftKey ? SIDEBAR_KEY_STEP_LARGE : SIDEBAR_KEY_STEP;
    const direction = event.key === "ArrowRight" ? 1 : -1;
    const wrapper = event.currentTarget.closest("[data-slot=sidebar-wrapper]");
    const current = wrapper
      ? Number.parseFloat(
          getComputedStyle(wrapper).getPropertyValue("--sidebar-width"),
        )
      : SIDEBAR_DEFAULT_WIDTH;
    actions.setWidth(
      (Number.isFinite(current) ? current : SIDEBAR_DEFAULT_WIDTH) +
        step * direction,
    );
  };

  return (
    <button
      type="button"
      aria-label="Resize sidebar"
      data-slot="sidebar-rail"
      tabIndex={open ? 0 : -1}
      className={cx(
        "absolute inset-y-0 -right-2 w-4 cursor-col-resize touch-none outline-none",
        "after:absolute after:inset-y-0 after:left-1/2 after:w-0.5 after:-translate-x-1/2 after:rounded-full",
        "focus-visible:after:bg-(--ring)",
        !open && "pointer-events-none",
        className,
      )}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onLostPointerCapture={() => finish(true)}
      onDoubleClick={() => actions.setWidth(SIDEBAR_DEFAULT_WIDTH)}
      onKeyDown={onKeyDown}
      {...props}
    />
  );
}

export type SidebarPanelProps = ComponentProps<"div">;

export function SidebarPanel({ className, ...props }: SidebarPanelProps) {
  const { open } = useSidebarState();
  return (
    <div
      data-slot="sidebar-panel"
      className={cx(
        "bg-panel md:rounded-(--radius-panel) md:border-hairline md:border-(--card-hairline) md:shadow-card",
        "ease-out-quint isolate min-w-0 flex-1 transition-[margin-left] duration-base md:my-2 md:mr-2 md:[[data-tab-strip]_&]:mt-0 motion-reduce:transition-none",
        !open && "md:ml-2 md:duration-fast",
        className,
      )}
      {...props}
    />
  );
}

export type SidebarContentProps = ComponentProps<"div">;

export function SidebarContent({ className, ...props }: SidebarContentProps) {
  const { open } = useSidebarState();
  return (
    <div
      data-slot="sidebar-content"
      inert={!open || undefined}
      className={cx(
        "ease-out-quint flex h-full min-w-0 flex-1 flex-col transition-[opacity,translate] delay-stagger duration-base",
        !open && "-translate-x-4 opacity-0 delay-0 duration-exit",
        "motion-reduce:transition-[opacity] motion-reduce:delay-0 motion-reduce:duration-collapse",
        className,
      )}
      {...props}
    />
  );
}

/**
 * The trigger's slot in a bar: a control-wide box that collapses to nothing
 * when the sidebar is open beside it, so a page top bar keeps its rhythm.
 * `tight` pulls the next item one step closer; a bar whose content sits on a
 * wider inset (the Explore crumb bar) passes `false` and keeps the gap.
 */
export function SidebarTriggerRail({ tight = true }: { tight?: boolean }) {
  const sidebar = useSidebarStateOptional();
  if (sidebar === null) return null;
  const visible = sidebar.isNarrow || !sidebar.open;
  return (
    <span
      inert={!visible || undefined}
      className={cx(
        "ease-out-quint flex shrink-0 items-center overflow-hidden transition-[width,margin,opacity] duration-base [[data-tab-strip]_&]:hidden motion-reduce:transition-none",
        visible
          ? cx("w-(--h-control-sm) opacity-100", tight ? "-mr-1" : "mr-0")
          : "mr-0 w-0 opacity-0",
      )}
    >
      <SidebarTrigger />
    </span>
  );
}

export type SidebarTriggerProps = { className?: string };

export function SidebarTrigger({ className }: SidebarTriggerProps) {
  const { open, isNarrow } = useSidebarState();
  const openMobile = useSidebarOpenMobile();
  const { toggle } = useSidebarActions();
  const pressed = isNarrow ? openMobile : open;
  const label = pressed ? "Close sidebar" : "Open sidebar";
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={label}
            aria-pressed={pressed}
            className={className}
            onClick={toggle}
          >
            <Icon name="sidebar-simple-left-wide" />
          </Button>
        }
      />
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}
