import { cx } from "class-variance-authority";
import type { ReactNode, Ref } from "react";

export type TakeoverCardProps = {
  slot: string;
  label: ReactNode;
  trailing?: ReactNode;
  footer: ReactNode;
  className?: string;
  children?: ReactNode;
  ref?: Ref<HTMLDivElement>;
};

export function TakeoverCard({
  slot,
  label,
  trailing,
  footer,
  className,
  children,
  ref,
}: TakeoverCardProps) {
  return (
    <div
      ref={ref}
      data-slot={slot}
      className={cx(
        "relative mb-2 flex max-h-full min-h-0 flex-col rounded-(--radius-card) bg-popover p-3 shadow-composer",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-px rounded-(--takeover-ring-radius) border-(length:--hairline) border-transparent [background:linear-gradient(180deg,var(--border-2),var(--border-1))] [mask:linear-gradient(var(--mask-opaque),var(--mask-opaque))_padding-box_exclude,linear-gradient(var(--mask-opaque),var(--mask-opaque))_border-box]"
      />
      <div className="relative flex min-h-0 flex-col">
        <div className="flex shrink-0 items-center justify-between gap-2 pb-3">
          <span className="text-xs font-normal text-muted-foreground-2">
            {label}
          </span>
          {trailing}
        </div>
        <div className="-mx-2.5 -my-0.5 min-h-0 overflow-x-hidden overflow-y-auto px-2.5 py-0.5">
          {children}
        </div>
        <div className="flex shrink-0 items-center justify-between gap-2 pt-3">
          {footer}
        </div>
      </div>
    </div>
  );
}
