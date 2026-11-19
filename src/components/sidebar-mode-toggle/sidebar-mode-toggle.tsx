import {
  type ComponentProps,
  type ComponentType,
  type SVGProps,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  cx,
  hairlineBorder,
  segmentedXsButton,
} from "@/components/app-sidebar/classes";
import { ListBulletsIcon, ShipIcon } from "@/components/app-sidebar/icons";
import { ShortcutTooltip } from "@/features/shell/keyboard";
import { Button } from "@/primitives/button";

export type SidebarMode = "captains" | "threads";

export const SIDEBAR_MODES: ReadonlyArray<
  [SidebarMode, string, ComponentType<SVGProps<SVGSVGElement>>]
> = [
  ["captains", "Captains", ShipIcon],
  ["threads", "Threads", ListBulletsIcon],
];

export type SidebarModeToggleProps = ComponentProps<"div"> & {
  mode?: SidebarMode;
  defaultMode?: SidebarMode;
  onModeChange?: (mode: SidebarMode) => void;
};

const durationSeconds = (element: Element, token: string) =>
  Number.parseFloat(getComputedStyle(element).getPropertyValue(token)) || 0;

export function SidebarModeToggle({
  mode,
  defaultMode = "threads",
  onModeChange,
  className,
  children,
  ...props
}: SidebarModeToggleProps) {
  const [localMode, setLocalMode] = useState(defaultMode);
  const current = mode ?? localMode;
  const groupRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const group = groupRef.current;
    const indicator = indicatorRef.current;
    if (group === null || indicator === null) return;
    const place = (animate: boolean) => {
      const selected = group.querySelector<HTMLElement>(
        ":scope > [data-selected]",
      );
      const before = indicator.hidden
        ? undefined
        : indicator.getBoundingClientRect();
      const box = group.getBoundingClientRect();
      for (const animation of indicator.getAnimations?.() ?? [])
        animation.cancel();
      indicator.hidden = selected === null;
      if (selected === null) return;
      const next = { left: selected.offsetLeft, width: selected.offsetWidth };
      Object.assign(indicator.style, {
        left: `${next.left}px`,
        top: `${selected.offsetTop}px`,
        width: `${next.width}px`,
        height: `${selected.offsetHeight}px`,
        borderRadius: getComputedStyle(selected).borderRadius,
      });
      if (
        !animate ||
        before === undefined ||
        typeof indicator.animate !== "function"
      )
        return;
      const from = {
        left: before.left - box.left - group.clientLeft,
        width: before.width,
      };
      if (from.left === next.left && from.width === next.width) return;
      if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches)
        return;
      indicator.animate(
        [
          {
            transform: `translateX(${from.left - next.left}px) scaleX(${from.width / next.width})`,
          },
          { transform: "none" },
        ],
        {
          duration: durationSeconds(group, "--duration-halo") * 1000,
          easing: getComputedStyle(group).getPropertyValue("--ease-out-quint"),
        },
      );
    };
    place(false);
    const mutations = new MutationObserver(() => place(true));
    mutations.observe(group, {
      subtree: true,
      attributeFilter: ["data-selected"],
    });
    const resize =
      typeof ResizeObserver === "undefined"
        ? undefined
        : new ResizeObserver(() => place(false));
    resize?.observe(group);
    return () => {
      mutations.disconnect();
      resize?.disconnect();
    };
  }, []);

  return (
    // biome-ignore lint/a11y/useSemanticElements: Capy renders the segmented group as a div with role="group"
    <div
      ref={groupRef}
      role="group"
      aria-label="Sidebar"
      data-slot="sidebar-mode"
      className={cx(
        "relative flex items-center gap-0.5 rounded-lg",
        hairlineBorder,
        "border-border-2 bg-secondary p-0.5 [&>[data-selected]]:bg-transparent! [&>[data-selected]]:shadow-none! [&>button]:relative",
        className,
      )}
      {...props}
    >
      <span
        ref={indicatorRef}
        aria-hidden
        hidden
        className="pointer-events-none absolute origin-left bg-card shadow-card"
      />
      {SIDEBAR_MODES.map(([value, label, ModeIcon]) => (
        <ShortcutTooltip
          key={value}
          command="sidebar.mode"
          label={label}
          render={
            <Button
              data-track-owner="shared/sidebar-mode-toggle.tsx#SidebarModeToggle:Button.1"
              type="button"
              size="xs"
              variant="segmented"
              aria-label={label}
              aria-pressed={current === value}
              data-selected={current === value ? "" : undefined}
              onClick={() => {
                if (mode === undefined) setLocalMode(value);
                onModeChange?.(value);
              }}
              className={segmentedXsButton}
            >
              <ModeIcon className="size-(--icon-sm)" />
            </Button>
          }
        />
      ))}
      {children}
    </div>
  );
}
