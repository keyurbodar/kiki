import type { ReactNode } from "react";
import { cx } from "./cx";

export type CardListHeaderProps = {
  label: ReactNode;
  action?: ReactNode;
  tools?: ReactNode;
  className?: string;
};

export function CardListHeader({
  label,
  action,
  tools,
  className,
}: CardListHeaderProps) {
  return (
    <div
      data-slot="card-list-header"
      className={cx(
        "flex min-h-15 items-center justify-between gap-3 py-3 pr-2 pl-4",
        className,
      )}
    >
      <span className="min-w-0 flex-1 text-sm font-medium text-foreground">
        {label}
      </span>
      <div className="flex shrink-0 items-center gap-0.5">
        {tools}
        {action}
      </div>
    </div>
  );
}
