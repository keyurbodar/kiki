// biome-ignore-all lint/a11y/useSemanticElements: Capy's table is a CSS grid of ARIA rows and cells, which <table> markup cannot subgrid
// biome-ignore-all lint/a11y/useFocusableInteractive: rows, headers and cells are not interactive; their buttons are
import { cva, cx, type VariantProps } from "class-variance-authority";
import { type ComponentProps, createContext, useContext } from "react";
import { Icon } from "@/primitives/icon";

export const tableVariants = cva(
  "isolate grid w-full overflow-x-auto overscroll-x-contain px-4 [--table-fluid-min:0rem] [--table-lead-min:0rem] max-md:[--table-fluid-min:8rem] max-md:[--table-lead-min:10rem] max-md:[--table-auto-min:auto] max-md:[clip-path:inset(0_0_0_0.5rem)]",
  {
    variants: {
      density: {
        directory: "[--table-row-h:3.125rem]",
        pick: "[--table-row-h:2.75rem]",
        compact: "[--table-row-h:2rem]",
      },
      flush: {
        true: "scrollbar-hide scroll-fade-x px-0 [overflow-wrap:normal] [--scroll-fade-ramp:1.5rem] max-md:[clip-path:none] max-md:[--table-fluid-min:0rem] max-md:[--table-lead-min:0rem] [&_[role=cell]:last-child]:pr-0 [&_[role=columnheader]]:whitespace-normal [&_[role=columnheader]:last-child]:pr-0",
        false: "",
      },
    },
    defaultVariants: { density: "directory", flush: false },
  },
);

const leadCell =
  "max-md:min-w-auto max-md:first:sticky max-md:first:left-0 max-md:first:z-(--z-table-lead) max-md:in-data-scrolled:first:bg-[var(--table-lead-bg,var(--panel))] max-md:in-data-scrolled:first:shadow-[-0.5rem_0_0_var(--table-lead-bg,var(--panel)),0.03125rem_0_0_var(--border-1)] in-data-pin-lead:first:sticky in-data-pin-lead:first:left-0 in-data-pin-lead:first:z-(--z-table-lead) in-data-pin-lead:in-data-scrolled:first:bg-[var(--table-lead-bg,var(--panel))] in-data-pin-lead:in-data-scrolled:first:shadow-[-0.5rem_0_0_var(--table-lead-bg,var(--panel)),0.03125rem_0_0_var(--border-1)]";

/** Capy's column template rewrite: fluid columns get minimum widths on narrow screens. */
export const tableColumns = (columns: string) => {
  const expanded = columns.replace(
    /repeat\(\s*(\d+)\s*,((?:[^()]|\([^()]*\))*)\)/g,
    (_, count: string, track: string) =>
      Array.from({ length: Number(count) }, () => track.trim()).join(" "),
  );
  const tracks =
    expanded.match(/(?:[^\s(]+|\((?:[^()]|\([^()]*\))*\))+/g) ?? [];
  if (tracks.join("").replace(/\s+/g, "") !== expanded.replace(/\s+/g, ""))
    return columns;
  return tracks
    .map((track, index) => {
      const fluid = /^minmax\(\s*0(?:px|rem)?\s*,(.+)\)$/.exec(track);
      if (fluid !== null)
        return `minmax(var(${index === 0 ? "--table-lead-min" : "--table-fluid-min"}),${fluid[1]})`;
      const fixed = /^minmax\(\s*([\d.]+(?:px|rem))\s*,\s*auto\s*\)$/.exec(
        track,
      );
      return fixed === null
        ? track
        : `minmax(var(--table-auto-min,${fixed[1]}),auto)`;
    })
    .join(" ");
};

const TableCardContext = createContext(false);

export type TableProps = ComponentProps<"div"> &
  VariantProps<typeof tableVariants> & {
    /** CSS grid template for the columns; every row is a subgrid of it. */
    columns?: string;
    card?: boolean;
    pinLead?: boolean;
    cardClassName?: string;
  };

/** Capy's ui/table: a CSS grid with role=table whose rows are subgrids. */
export function Table({
  className,
  density,
  flush,
  columns = "",
  card = false,
  pinLead = false,
  cardClassName,
  style,
  onScroll,
  ...props
}: TableProps) {
  const table = (
    <div
      role="table"
      data-slot="table"
      data-pin-lead={pinLead || undefined}
      style={{ gridTemplateColumns: tableColumns(columns), ...style }}
      className={cx(
        tableVariants({ density, flush }),
        card && "[--table-lead-bg:var(--card)]",
        className,
      )}
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
  if (!card) return table;
  return (
    <TableCardContext.Provider value>
      <div
        data-slot="card"
        className={cx(
          "flex flex-col overflow-clip rounded-(--radius-card) border-[0.03125rem] border-(--card-hairline) bg-card py-2 shadow-card",
          cardClassName,
        )}
      >
        {table}
      </div>
    </TableCardContext.Provider>
  );
}

export type TableHeaderProps = ComponentProps<"div"> & { filled?: boolean };

export function TableHeader({ filled, className, ...props }: TableHeaderProps) {
  const inCard = useContext(TableCardContext);
  return (
    <div
      role="row"
      className={cx(
        "col-span-full grid h-8 grid-cols-subgrid items-center",
        (filled ?? inCard) &&
          "relative mb-0.5 [--table-lead-bg:var(--section)] before:absolute before:inset-y-0 before:-inset-x-2 before:rounded-(--radius-card) before:bg-section [&>*]:relative",
        className,
      )}
      {...props}
    />
  );
}

export type TableHeaderCellProps = ComponentProps<"div"> & {
  sorted?: boolean;
  numeric?: boolean;
};

export function TableHeaderCell({
  sorted = false,
  numeric = false,
  className,
  children,
  ...props
}: TableHeaderCellProps) {
  return (
    <div
      role="columnheader"
      className={cx(
        "flex min-w-0 items-center gap-0.5 pr-4 text-xs font-normal whitespace-nowrap text-muted-foreground-1 select-none",
        numeric && "justify-end",
        leadCell,
        "in-data-pin-lead:first:[--table-lead-bg:var(--card)]",
        className,
      )}
      {...props}
    >
      {children}
      {sorted && (
        <Icon name="arrow-down" className="size-3 shrink-0 text-foreground" />
      )}
    </div>
  );
}

export type SortableTableHeaderCellProps = Omit<
  ComponentProps<"div">,
  "onClick"
> & {
  direction?: "ascending" | "descending";
  onSort: () => void;
};

export function SortableTableHeaderCell({
  direction,
  onSort,
  className,
  children,
  ...props
}: SortableTableHeaderCellProps) {
  return (
    <div
      role="columnheader"
      aria-sort={direction ?? "none"}
      className={cx(
        "flex min-w-0 items-center pr-4 text-xs font-normal whitespace-nowrap text-muted-foreground-1 select-none",
        leadCell,
        className,
      )}
      {...props}
    >
      <button
        type="button"
        className="flex cursor-pointer items-center gap-0.5 rounded outline-none hover:text-foreground focus-visible:outline-ring-inset"
        onClick={onSort}
      >
        {children}
        {direction !== undefined && (
          <Icon
            name="arrow-down"
            className={cx(
              "size-3 shrink-0 text-foreground",
              direction === "ascending" && "rotate-180",
            )}
          />
        )}
      </button>
    </div>
  );
}

export type TableGroupProps = {
  label: React.ReactNode;
  count?: number;
  children?: React.ReactNode;
  className?: string;
};

export function TableGroup({
  label,
  count,
  children,
  className,
}: TableGroupProps) {
  const inCard = useContext(TableCardContext);
  return (
    <div
      role="row"
      className={cx(
        "relative col-span-full mb-0.5 grid h-8 grid-cols-subgrid items-center",
        !inCard && "[--table-lead-bg:var(--section)]",
        inCard && "mt-2 mb-0",
        className,
      )}
    >
      {!inCard && (
        <div className="absolute inset-y-0 -inset-x-2 rounded-(--radius-card) bg-section" />
      )}
      <span
        className={cx(
          "relative flex items-center text-xs font-medium text-muted-foreground-1",
          children === undefined
            ? "col-span-full"
            : "max-md:sticky max-md:left-0 max-md:z-(--z-table-lead) max-md:in-data-scrolled:bg-[var(--table-lead-bg,var(--panel))] max-md:in-data-scrolled:shadow-[-0.5rem_0_0_var(--table-lead-bg,var(--panel)),0.03125rem_0_0_var(--border-1)]",
        )}
      >
        <span className="flex items-center gap-1.5 max-md:sticky max-md:left-0">
          {label}
          {count !== undefined && (
            <span className="text-muted-foreground-3 tabular-nums">
              {count}
            </span>
          )}
        </span>
      </span>
      {children}
    </div>
  );
}

export type TableRowProps = ComponentProps<"div"> & { interactive?: boolean };

export function TableRow({
  interactive = true,
  className,
  ...props
}: TableRowProps) {
  return (
    <div
      role="row"
      className={cx(
        "relative col-span-full grid grid-cols-subgrid",
        interactive &&
          "before:absolute before:inset-y-0 before:-inset-x-2 before:rounded before:transition-colors before:duration-100 hover:before:bg-section",
        className,
      )}
      {...props}
    />
  );
}

export type TableCellProps = ComponentProps<"div"> & {
  lead?: boolean;
  numeric?: boolean;
};

export function TableCell({
  lead = false,
  numeric = false,
  className,
  ...props
}: TableCellProps) {
  return (
    <div
      role="cell"
      className={cx(
        "relative flex min-h-[var(--table-row-h,3.125rem)] min-w-0 items-center pr-4 text-xs font-normal text-muted-foreground-1",
        lead && "whitespace-nowrap text-foreground",
        numeric && "justify-end tabular-nums whitespace-nowrap",
        leadCell,
        className,
      )}
      {...props}
    />
  );
}
