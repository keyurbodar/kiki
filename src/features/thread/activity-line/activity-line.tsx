import { cx } from "class-variance-authority";
import {
  type ComponentProps,
  type CSSProperties,
  type ReactNode,
  useState,
} from "react";

export { LiveStatus, type LiveStatusProps } from "@/features/thread/live-status";

const rule =
  "w-[clamp(0px,calc((100%-var(--spacing)*6)*9999),100%)] border-t-[length:--spacing(0.125)] border-border-2 motion-safe:transition-[scale] motion-safe:duration-base motion-safe:ease-out-quint";

export type ActivityLineProps = Omit<ComponentProps<"div">, "children"> & {
  label?: ReactNode;
  expanded?: boolean;
  needsYou?: boolean;
  onToggle?: () => void;
  children?: ReactNode;
};

export function ActivityLine({
  label,
  expanded = false,
  needsYou = false,
  onToggle,
  children,
  className,
  ...props
}: ActivityLineProps) {
  const ruleClass = cx(
    rule,
    !expanded && "scale-x-0 motion-safe:duration-exit",
  );
  return (
    <div
      data-slot="activity-line"
      className={cx("flex flex-col items-center", className)}
      {...props}
    >
      <div className="flex w-full items-center justify-center gap-3">
        <span aria-hidden className="flex min-w-0 flex-1 justify-end">
          <span className={cx(ruleClass, "origin-right")} />
        </span>
        <button
          type="button"
          aria-expanded={expanded}
          onClick={onToggle}
          className={cx(
            "flex min-h-7 min-w-0 items-center gap-1.5 py-1 transition-colors duration-hover hover:text-foreground [&>svg:last-child]:opacity-0 [&>svg:last-child]:transition-opacity [&>svg:last-child]:duration-fast [&>svg:last-child]:ease-out-quint [&:hover>svg:last-child]:opacity-100 data-[panel-open]:[&>svg:last-child]:opacity-100",
            "w-fit max-w-[86%] cursor-pointer text-xs select-none md:max-w-[80%]",
            needsYou
              ? "font-medium text-foreground"
              : "font-normal text-muted-foreground-2",
          )}
        >
          {label}
        </button>
        <span aria-hidden className="flex min-w-0 flex-1">
          <span className={cx(ruleClass, "origin-left")} />
        </span>
      </div>
      <div className="flex w-full flex-col text-left">{children}</div>
    </div>
  );
}

const memberOpen = "grid-rows-[1fr] opacity-100 duration-fast ease-out-quint";
const memberClosed = "grid-rows-[0fr] opacity-0 duration-exit ease-out-quint";

export type ActivityLineMemberProps = Omit<ComponentProps<"div">, "slot"> & {
  open?: boolean;
  slot?: string;
  delayMs?: number;
};

export function ActivityLineMember({
  open = true,
  slot = "activity-line-member",
  delayMs,
  className,
  children,
  ...props
}: ActivityLineMemberProps) {
  const [mounted, setMounted] = useState(open);
  if (open && !mounted) setMounted(true);
  const style: CSSProperties | undefined =
    delayMs === undefined ? undefined : { transitionDelay: `${delayMs}ms` };
  return (
    <div
      aria-hidden={!open}
      inert={!open || undefined}
      data-slot={slot}
      className={cx(
        "grid motion-safe:transition-[grid-template-rows,opacity]",
        open ? memberOpen : memberClosed,
        className,
      )}
      onTransitionEnd={(event) => {
        if (!open && event.target === event.currentTarget) setMounted(false);
      }}
      {...props}
    >
      <div className="focus-gutter min-h-0 min-w-0 overflow-clip [overflow-clip-margin:--spacing(0.5)]">
        <div style={style}>{mounted && children}</div>
      </div>
    </div>
  );
}
