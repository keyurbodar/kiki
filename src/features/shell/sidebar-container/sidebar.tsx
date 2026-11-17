import { cx } from "class-variance-authority";
import {
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  useEffect,
  useRef,
} from "react";
import {
  SidebarContainer,
  SidebarContent,
  SidebarGap,
  SidebarRail,
} from "@/primitives/sidebar";
import {
  clampSidebarWidth,
  SIDEBAR_COLLAPSE_THRESHOLD,
  SIDEBAR_DEFAULT_WIDTH,
  SIDEBAR_KEY_STEP,
  SIDEBAR_KEY_STEP_LARGE,
  useSidebarActions,
  useSidebarState,
} from "./sidebar-state";

export function Sidebar({ children }: { children: ReactNode }) {
  const { open } = useSidebarState();
  return (
    <>
      <SidebarGap
        className={cx(
          "ease-out-quint relative shrink-0 transition-[width] max-md:hidden",
          open ? "w-(--sidebar-width) duration-base" : "w-0 duration-fast",
          "motion-reduce:transition-none",
        )}
      />
      <SidebarContainer
        className={cx(
          "ease-out-quint fixed top-(--shell-top) bottom-0 left-0 z-(--z-sidebar) flex w-(--sidebar-width) transition-[translate] max-md:hidden",
          open ? "duration-base" : "-translate-x-full duration-fast",
          "motion-reduce:transition-none",
        )}
      >
        <SidebarContent
          inert={!open || undefined}
          className={cx(
            "ease-out-quint flex h-full min-w-0 flex-1 flex-col transition-[opacity,translate]",
            open
              ? "delay-stagger duration-base"
              : "-translate-x-4 opacity-0 delay-0 duration-exit",
            "motion-reduce:transition-[opacity] motion-reduce:delay-0 motion-reduce:duration-collapse",
          )}
        >
          {children}
        </SidebarContent>
        <SidebarResizeRail />
      </SidebarContainer>
    </>
  );
}

type DragState = {
  pointerId: number;
  startX: number;
  startWidth: number;
  pendingWidth: number;
  rafId: number | null;
  followers: HTMLElement[];
  suppressed: HTMLElement[];
};

export const NO_TRANSITION = "calc(var(--duration-fast) * 0)";

const DRAG_TARGETS =
  "[data-slot=sidebar-gap], [data-slot=sidebar-container], [data-slot=sidebar-panel], [data-slot=tab-controls]";

export function SidebarResizeRail() {
  const { open } = useSidebarState();
  const actions = useSidebarActions();
  const drag = useRef<DragState | null>(null);

  const finish = (commit: boolean) => {
    const state = drag.current;
    if (!state) return;
    drag.current = null;
    if (state.rafId !== null) cancelAnimationFrame(state.rafId);
    if (commit) actions.setWidth(state.pendingWidth);
    for (const el of state.followers) el.style.removeProperty("width");
    for (const el of state.suppressed)
      el.style.removeProperty("transition-duration");
    document.body.style.removeProperty("cursor");
    document.body.style.removeProperty("user-select");
  };

  const finishRef = useRef(finish);
  finishRef.current = finish;
  useEffect(() => () => finishRef.current(false), []);

  const onPointerDown = (event: PointerEvent<HTMLElement>) => {
    if (event.button !== 0) return;
    const wrapper = event.currentTarget.closest<HTMLElement>(
      "[data-slot=sidebar-wrapper]",
    );
    const container = event.currentTarget.closest<HTMLElement>(
      "[data-slot=sidebar-container]",
    );
    if (!wrapper || !container) return;
    event.preventDefault();
    const width = clampSidebarWidth(container.getBoundingClientRect().width);
    const targets = [...wrapper.querySelectorAll<HTMLElement>(DRAG_TARGETS)];
    for (const el of targets)
      el.style.setProperty("transition-duration", NO_TRANSITION);
    drag.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startWidth: width,
      pendingWidth: width,
      rafId: null,
      followers: targets.filter((el) => el.dataset.slot !== "sidebar-panel"),
      suppressed: targets,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    const state = drag.current;
    if (!state || event.pointerId !== state.pointerId) return;
    const next = state.startWidth + event.clientX - state.startX;
    if (next < SIDEBAR_COLLAPSE_THRESHOLD) {
      if (event.currentTarget.hasPointerCapture(state.pointerId))
        event.currentTarget.releasePointerCapture(state.pointerId);
      finish(false);
      actions.setOpen(false);
      return;
    }
    state.pendingWidth = clampSidebarWidth(next);
    if (state.rafId !== null) return;
    state.rafId = requestAnimationFrame(() => {
      const current = drag.current;
      if (!current) return;
      current.rafId = null;
      for (const el of current.followers)
        el.style.width = `${current.pendingWidth}px`;
    });
  };

  const onPointerUp = (event: PointerEvent<HTMLElement>) => {
    const state = drag.current;
    if (!state || event.pointerId !== state.pointerId) return;
    if (event.currentTarget.hasPointerCapture(state.pointerId))
      event.currentTarget.releasePointerCapture(state.pointerId);
    finish(true);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const step = event.shiftKey ? SIDEBAR_KEY_STEP_LARGE : SIDEBAR_KEY_STEP;
    const direction = event.key === "ArrowRight" ? 1 : -1;
    const wrapper = event.currentTarget.closest<HTMLElement>(
      "[data-slot=sidebar-wrapper]",
    );
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
    <SidebarRail
      data-track-owner="ui/sidebar.tsx#SidebarRail:button[Resize sidebar]"
      role="button"
      aria-label="Resize sidebar"
      tabIndex={open ? 0 : -1}
      className={cx(
        "absolute inset-y-0 -right-2 w-4 cursor-col-resize touch-none outline-none",
        "after:absolute after:inset-y-0 after:left-1/2 after:w-0.5 after:-translate-x-1/2 after:rounded-full",
        "focus-visible:after:bg-(--ring)",
        !open && "pointer-events-none",
      )}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onLostPointerCapture={() => finish(true)}
      onDoubleClick={() => actions.setWidth(SIDEBAR_DEFAULT_WIDTH)}
      onKeyDown={onKeyDown}
    />
  );
}
