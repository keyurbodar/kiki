import { Collapsible as BaseCollapsible } from "@base-ui/react/collapsible";
import { cx } from "class-variance-authority";
import { type ComponentProps, type Ref, useCallback } from "react";
import { motion } from "@/lib/motion";
import { Icon } from "@/primitives/icon";
import "./collapsible.css";

export type CollapsibleProps = ComponentProps<typeof BaseCollapsible.Root>;

export function Collapsible(props: CollapsibleProps) {
  return <BaseCollapsible.Root data-slot="collapsible" {...props} />;
}

const triggerBase = cx(
  "group/collapsible flex cursor-pointer items-center gap-1.5 rounded text-left font-medium select-none",
  "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-(--icon-sm)",
  motion.focusRing,
);

const triggerTones = {
  default: "",
  muted: "text-sm text-muted-foreground-1 hover:text-foreground",
  section:
    "h-9 gap-2 rounded-(--radius-card) bg-section px-2 text-sm text-foreground " +
    motion.hover,
} as const;

export type CollapsibleTriggerProps = Omit<
  ComponentProps<typeof BaseCollapsible.Trigger>,
  "className"
> & {
  className?: string;
  showChevron?: boolean;
  tone?: keyof typeof triggerTones;
  block?: boolean;
};

export function CollapsibleTrigger({
  className,
  showChevron = true,
  tone = "default",
  block = false,
  children,
  ...props
}: CollapsibleTriggerProps) {
  return (
    <BaseCollapsible.Trigger
      data-slot="collapsible-trigger"
      className={cx(
        triggerBase,
        block ? "w-full" : cx(motion.focusGutter, "w-fit"),
        triggerTones[tone],
        className,
      )}
      {...props}
    >
      {children}
      {showChevron && (
        <Icon
          name="chevron-down-small"
          size="sm"
          className="-rotate-90 text-muted-foreground-3 group-data-[panel-open]/collapsible:rotate-0"
        />
      )}
    </BaseCollapsible.Trigger>
  );
}

const PANEL_HEIGHT = "--collapsible-panel-height";

const scrollParent = (element: HTMLElement) => {
  let parent = element.parentElement;
  while (parent !== null) {
    const { overflowY } = getComputedStyle(parent);
    if (overflowY === "auto" || overflowY === "scroll") return parent;
    parent = parent.parentElement;
  }
  return null;
};

export const visibleClosingHeight = (panel: HTMLElement) => {
  const scroller = scrollParent(panel);
  if (scroller === null) return undefined;
  const panelRect = panel.getBoundingClientRect();
  const scrollerRect = scroller.getBoundingClientRect();
  if (
    !(
      panelRect.top < scrollerRect.top ||
      panelRect.bottom <= scrollerRect.bottom + 1
    )
  )
    return undefined;
  return Math.max(0, Math.round(scrollerRect.bottom - panelRect.top));
};

const clampClosingHeight = (panel: HTMLElement) => {
  const observer = new MutationObserver(() => {
    if (!panel.hasAttribute("data-closed")) {
      panel.style.removeProperty(PANEL_HEIGHT);
      return;
    }
    const height = visibleClosingHeight(panel);
    if (height !== undefined)
      panel.style.setProperty(PANEL_HEIGHT, `${height}px`, "important");
  });
  observer.observe(panel, {
    attributes: true,
    attributeFilter: ["data-closed"],
  });
  return () => observer.disconnect();
};

export type CollapsiblePanelProps = Omit<
  ComponentProps<typeof BaseCollapsible.Panel>,
  "className"
> & { className?: string };

export function CollapsiblePanel({
  className,
  ref,
  ...props
}: CollapsiblePanelProps) {
  const panelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (typeof ref === "function") ref(node);
      else if (ref) (ref as { current: HTMLDivElement | null }).current = node;
      if (node !== null) return clampClosingHeight(node);
    },
    [ref],
  );
  return (
    <BaseCollapsible.Panel
      data-slot="collapsible-panel"
      ref={panelRef as Ref<HTMLDivElement>}
      className={cx(
        "h-(--collapsible-panel-height) overflow-hidden",
        motion.collapsible,
        className,
      )}
      {...props}
    />
  );
}
