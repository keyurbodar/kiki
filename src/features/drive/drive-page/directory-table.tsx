// biome-ignore-all lint/a11y: Capy's directory table is an ARIA grid of div subgrid rows (role table/row/cell), class for class from the bundle
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps, ReactNode } from "react";

/**
 * Capy's directory table (ui/table): a CSS grid whose rows are subgrids, so
 * every row lines up with the header. The `table` primitive is still a
 * `<table>` stub; this is the grid version the drive screens render, class for
 * class from the bundle.
 */
const tableVariants = cva(
  "isolate grid w-full overflow-x-auto overscroll-x-contain px-4 [--table-fluid-min:0] [--table-lead-min:0] max-md:[--table-fluid-min:calc(var(--spacing)*32)] max-md:[--table-lead-min:calc(var(--spacing)*40)] max-md:[--table-auto-min:auto] max-md:[clip-path:inset(0_0_0_0.5rem)]",
  {
    variants: {
      density: {
        directory: "[--table-row-h:calc(var(--spacing)*12.5)]",
        pick: "[--table-row-h:calc(var(--spacing)*11)]",
        compact: "[--table-row-h:calc(var(--spacing)*8)]",
      },
    },
    defaultVariants: { density: "directory" },
  },
);

const lead =
  "max-md:min-w-auto max-md:first:sticky max-md:first:left-0 max-md:first:z-(--z-table-lead) max-md:in-data-scrolled:first:bg-(--table-lead-bg,var(--panel)) max-md:in-data-scrolled:first:shadow-[-0.5rem_0_0_var(--table-lead-bg,var(--panel)),var(--border-width-hairline)_0_0_var(--border-1)]";

/** Capy's column rewrite: fluid columns get a min on narrow screens. */
export function tableColumns(columns: string) {
  const parts = columns.match(/(?:[^\s(]+|\((?:[^()]|\([^()]*\))*\))+/g) ?? [];
  return parts
    .map((part, index) => {
      const fluid = /^minmax\(\s*0(?:rem)?\s*,(.+)\)$/.exec(part);
      if (fluid !== null) {
        return `minmax(var(${index === 0 ? "--table-lead-min" : "--table-fluid-min"}),${fluid[1]})`;
      }
      const auto = /^minmax\(\s*([\d.]+rem|min-content)\s*,\s*auto\s*\)$/.exec(
        part,
      );
      return auto === null
        ? part
        : `minmax(var(--table-auto-min,${auto[1]}),auto)`;
    })
    .join(" ");
}

export type DirectoryTableProps = ComponentProps<"div"> &
  VariantProps<typeof tableVariants> & { columns: string };

export function DirectoryTable({
  columns,
  density,
  className,
  style,
  onScroll,
  ...props
}: DirectoryTableProps) {
  return (
    <div
      role="table"
      style={{ gridTemplateColumns: tableColumns(columns), ...style }}
      className={tableVariants({ density, className })}
      onScroll={(event) => {
        event.currentTarget.toggleAttribute(
          "data-scrolled",
          event.currentTarget.scrollLeft > 0,
        );
        onScroll?.(event);
      }}
      {...props}
    />
  );
}

export function DirectoryTableHeader({
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      role="row"
      className={[
        "col-span-full grid h-8 grid-cols-subgrid items-center",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}

export function DirectoryTableHead({
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      role="columnheader"
      className={[
        "flex min-w-0 items-center gap-0.5 pr-4 text-xs font-normal whitespace-nowrap text-muted-foreground-1 select-none",
        lead,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}

export function DirectoryTableSection({
  label,
  count,
}: {
  label: ReactNode;
  count?: number;
}) {
  return (
    <div
      role="row"
      className="relative col-span-full mb-0.5 grid h-8 grid-cols-subgrid items-center [--table-lead-bg:var(--section)]"
    >
      <div className="absolute inset-y-0 -inset-x-2 rounded-(--radius-card) bg-section" />
      <span className="relative col-span-full flex items-center text-xs font-medium text-muted-foreground-1">
        <span className="flex items-center gap-1.5 max-md:sticky max-md:left-0">
          {label}
          {count !== undefined && (
            <span className="text-muted-foreground-3 tabular-nums">
              {count}
            </span>
          )}
        </span>
      </span>
    </div>
  );
}

export const tableRowClass =
  "relative col-span-full grid grid-cols-subgrid before:absolute before:inset-y-0 before:-inset-x-2 before:rounded before:transition-colors before:duration-hover hover:before:bg-section";

export function DirectoryTableRow({
  className,
  interactive = true,
  ...props
}: ComponentProps<"div"> & { interactive?: boolean }) {
  return (
    <div
      role="row"
      className={[
        interactive
          ? tableRowClass
          : "relative col-span-full grid grid-cols-subgrid",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}

export function DirectoryTableCell({
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      role="cell"
      className={[
        "relative flex min-h-(--table-row-h) min-w-0 items-center pr-4 text-xs font-normal text-muted-foreground-1",
        lead,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}
