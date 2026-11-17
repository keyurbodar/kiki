import { cx } from "class-variance-authority";
import type { ComponentProps } from "react";

export type AccessGridProps = ComponentProps<"div"> & { columns: string };

export function AccessGrid({
  columns,
  className,
  style,
  ...props
}: AccessGridProps) {
  return (
    // biome-ignore lint/a11y/useSemanticElements: Capy's grid table is a CSS grid of divs with ARIA table roles
    <div
      role="table"
      data-slot="access-grid"
      style={{ gridTemplateColumns: columns, ...style }}
      className={cx("grid", className)}
      {...props}
    />
  );
}

export function AccessGridRow({ className, ...props }: ComponentProps<"div">) {
  return (
    // biome-ignore lint/a11y/useSemanticElements: rows are subgrid divs in Capy's grid table
    // biome-ignore lint/a11y/useFocusableInteractive: rows are not focus targets; their buttons are
    <div
      role="row"
      className={cx(
        "relative col-span-full grid grid-cols-subgrid",
        "before:absolute before:inset-y-0 before:-inset-x-2 before:rounded before:transition-colors before:duration-100 hover:before:bg-section",
        className,
      )}
      {...props}
    />
  );
}

export function AccessGridCell({ className, ...props }: ComponentProps<"div">) {
  return (
    // biome-ignore lint/a11y/useSemanticElements: cells are flex divs in Capy's grid table
    <div
      role="cell"
      className={cx(
        "relative flex min-h-[var(--table-row-h,calc(var(--spacing)*12.5))] min-w-0 items-center pr-4 text-xs font-normal text-muted-foreground-1",
        className,
      )}
      {...props}
    />
  );
}
