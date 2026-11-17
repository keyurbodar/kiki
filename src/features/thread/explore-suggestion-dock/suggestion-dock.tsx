import type { ComponentProps, ReactNode } from "react";

export type SuggestionDockProps = Omit<ComponentProps<"div">, "children"> & {
  slot: string;
  label: ReactNode;
  trailing?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
};

export function SuggestionDock({
  slot,
  label,
  trailing,
  footer,
  className,
  children,
  ...props
}: SuggestionDockProps) {
  return (
    <div
      data-slot={slot}
      className={[
        "relative mb-2 flex max-h-full min-h-0 flex-col rounded-(--radius-card) bg-popover p-3 shadow-composer",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-px rounded-[calc(var(--radius-card)+var(--border-width-hairline)*2)] border-hairline border-transparent [background:linear-gradient(180deg,var(--border-2),var(--border-1))] [mask:linear-gradient(black,black)_padding-box_exclude,linear-gradient(black,black)_border-box]"
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
