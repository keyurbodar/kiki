import { cx } from "class-variance-authority";
import type { ComponentProps, ReactNode } from "react";

export type SelectorMenuListProps = ComponentProps<"div"> & {
  search?: ReactNode;
  footer?: ReactNode;
};

export function SelectorMenuList({
  search,
  footer,
  className,
  ...props
}: SelectorMenuListProps) {
  return (
    <div
      role="presentation"
      className="relative md:-m-1 md:flex md:max-h-[min(20rem,var(--available-height,20rem))] md:min-h-0 md:flex-col md:overflow-hidden md:p-1"
    >
      <div
        role="presentation"
        className="sticky top-0 bg-popover md:static md:shrink-0"
      >
        {search}
      </div>
      <div
        role="presentation"
        data-slot="selector-menu-list"
        data-menu-list
        className={cx(
          "md:min-h-0 md:flex-1 md:overflow-x-hidden md:overflow-y-auto md:scroll-fade-y",
          className,
        )}
        {...props}
      />
      {footer ? (
        <div
          role="presentation"
          className="sticky bottom-0 bg-popover md:static md:shrink-0"
        >
          {footer}
        </div>
      ) : null}
    </div>
  );
}
