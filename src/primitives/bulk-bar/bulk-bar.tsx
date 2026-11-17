import { cx } from "class-variance-authority";
import type { ComponentProps, ReactNode } from "react";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";

export type BulkBarProps = ComponentProps<"div"> & {
  /** Number of selected items, shown as "<count> selected". */
  count: number;
  onClear: () => void;
};

/** Floating selection bar pinned to the bottom of the nearest positioned ancestor. */
export function BulkBar({
  count,
  onClear,
  className,
  children,
  ...props
}: BulkBarProps) {
  return (
    <div
      data-slot="bulk-bar"
      className={cx(
        "@container/bulk pointer-events-none absolute inset-x-0 bottom-[calc(1.5rem+var(--safe-bottom))] z-(--z-top-bar) flex justify-center",
        className,
      )}
      {...props}
    >
      <div className="pointer-events-auto flex w-max max-w-[calc(100%-1rem)] items-center gap-0.5 rounded-(--radius-card) border-hairline border-border-2 bg-popover p-1 shadow-overlay">
        <span className="px-2 text-sm font-medium whitespace-nowrap text-foreground tabular-nums">
          {count} selected
        </span>
        {children}
        <BulkBarAction label="Clear selection">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Clear selection"
            onClick={onClear}
          >
            <Icon name="cross-medium" size={null} />
          </Button>
        </BulkBarAction>
      </div>
    </div>
  );
}

export type BulkBarActionProps = {
  label: string;
  /** Wraps the control in a span so the tooltip still opens while it is disabled. */
  disabled?: boolean;
  children: ReactNode;
};

/** Wraps one bulk action control in a tooltip naming it. */
export function BulkBarAction({
  label,
  disabled = false,
  children,
}: BulkBarActionProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          disabled ? (
            <span className="inline-flex">{children}</span>
          ) : (
            (children as TooltipTriggerRender)
          )
        }
      />
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

type TooltipTriggerRender = ComponentProps<typeof TooltipTrigger>["render"];

export type BulkBarLabelProps = {
  /** Container width below which the label hides, leaving the icon. */
  collapseAt?: "lg" | "xl";
  children: ReactNode;
};

/** Text of a bulk action that collapses when the bar gets narrow. */
export function BulkBarLabel({
  collapseAt = "lg",
  children,
}: BulkBarLabelProps) {
  return (
    <span
      className={
        collapseAt === "xl" ? "@max-xl/bulk:hidden" : "@max-lg/bulk:hidden"
      }
    >
      {children}
    </span>
  );
}
