// biome-ignore-all lint/a11y/useSemanticElements: Capy's table is a CSS grid whose rows are subgrids, which <table> parts cannot be.
// biome-ignore-all lint/a11y/useFocusableInteractive: rows and header cells are not focus stops; the controls inside them are.
import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { Link, type LinkProps } from "@tanstack/react-router";
import { cva, cx, type VariantProps } from "class-variance-authority";
import {
  type ComponentProps,
  createContext,
  type ReactNode,
  useContext,
} from "react";
import { Card } from "@/primitives/card";
import { Icon } from "@/primitives/icon";

export const tableVariants = cva(
  "isolate grid w-full overflow-x-auto overscroll-x-contain [--table-fluid-min:0] [--table-lead-min:0] max-md:[--table-auto-min:auto]",
  {
    variants: {
      density: {
        directory: "[--table-row-h:3.125rem]",
        pick: "[--table-row-h:2.75rem]",
        compact: "[--table-row-h:2rem]",
      },
      flush: {
        true: "scrollbar-hide scroll-fade-x [overflow-wrap:normal] [--scroll-fade-ramp:1.5rem] [&_[role=cell]:last-child]:pr-0 [&_[role=columnheader]]:whitespace-normal [&_[role=columnheader]:last-child]:pr-0",
        false:
          "px-4 max-md:[--table-fluid-min:8rem] max-md:[--table-lead-min:10rem] max-md:[clip-path:inset(0_0_0_0.5rem)]",
      },
    },
    defaultVariants: { density: "directory", flush: false },
  },
);

const stickyLead = cx(
  "max-md:min-w-auto max-md:first:sticky max-md:first:left-0 max-md:first:z-(--z-table-lead)",
  "max-md:in-data-scrolled:first:bg-[var(--table-lead-bg,var(--panel))] max-md:in-data-scrolled:first:shadow-[-0.5rem_0_0_var(--table-lead-bg,var(--panel)),var(--border-width-hairline)_0_0_var(--border-1)]",
  "in-data-pin-lead:first:sticky in-data-pin-lead:first:left-0 in-data-pin-lead:first:z-(--z-table-lead)",
  "in-data-pin-lead:in-data-scrolled:first:bg-[var(--table-lead-bg,var(--panel))] in-data-pin-lead:in-data-scrolled:first:shadow-[-0.5rem_0_0_var(--table-lead-bg,var(--panel)),var(--border-width-hairline)_0_0_var(--border-1)]",
);

/**
 * Expands repeat() and rewrites zero-minimum minmax() tracks so narrow screens
 * can give them a floor (--table-lead-min for the first track,
 * --table-fluid-min for the rest), and lets fixed-minimum auto tracks relax.
 * Templates it cannot tokenise come back unchanged.
 */
export function tableColumns(template: string): string {
  const expanded = template.replace(
    /repeat\(\s*(\d+)\s*,((?:[^()]|\([^()]*\))*)\)/g,
    (_, count: string, track: string) =>
      Array.from({ length: Number(count) }, () => track.trim()).join(" "),
  );
  const tracks =
    expanded.match(/(?:[^\s(]+|\((?:[^()]|\([^()]*\))*\))+/g) ?? [];
  if (tracks.join("").replace(/\s+/g, "") !== expanded.replace(/\s+/g, "")) {
    return template;
  }
  return tracks
    .map((track, index) => {
      const fluid = /^minmax\(\s*0(?:px)?\s*,(.+)\)$/.exec(track);
      if (fluid !== null) {
        const floor = index === 0 ? "--table-lead-min" : "--table-fluid-min";
        return `minmax(var(${floor}),${fluid[1]})`;
      }
      const auto = /^minmax\(\s*([\d.]+(?:px|rem))\s*,\s*auto\s*\)$/.exec(
        track,
      );
      return auto === null
        ? track
        : `minmax(var(--table-auto-min,${auto[1]}),auto)`;
    })
    .join(" ");
}

const TableCardContext = createContext(false);

export type TableProps = ComponentProps<"div"> &
  VariantProps<typeof tableVariants> & {
    /** grid-template-columns for every row; rows are subgrids of it. */
    columns?: string;
    /** Wraps the table in a Card and fills header rows. */
    card?: boolean;
    /** Keeps the first column pinned while the table scrolls sideways. */
    pinLead?: boolean;
    cardClassName?: string;
  };

export function Table({
  columns,
  density,
  flush,
  card = false,
  pinLead = false,
  cardClassName,
  className,
  onScroll,
  ...props
}: TableProps) {
  const table = (
    <div
      role="table"
      data-slot="table"
      data-pin-lead={pinLead || undefined}
      style={{
        gridTemplateColumns:
          columns === undefined ? undefined : tableColumns(columns),
      }}
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
      <Card className={cx("py-2", cardClassName)}>{table}</Card>
    </TableCardContext.Provider>
  );
}

export type TableHeaderProps = ComponentProps<"div"> & {
  /** Section-filled header band; defaults to on inside a card table. */
  filled?: boolean;
};

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
  /** Shows the sort arrow on a column the table is sorted by. */
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
        stickyLead,
        "in-data-pin-lead:first:[--table-lead-bg:var(--card)]",
        className,
      )}
      {...props}
    >
      {children}
      {sorted && (
        <Icon
          name="arrow-down"
          size={null}
          className="size-3 shrink-0 text-foreground"
        />
      )}
    </div>
  );
}

export type SortDirection = "ascending" | "descending";

export type SortableTableHeaderCellProps = ComponentProps<"div"> & {
  /** Sort on this column; leave undefined while another column sorts. */
  direction?: SortDirection;
  onSort?: () => void;
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
        stickyLead,
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
            size={null}
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
  label: ReactNode;
  count?: number;
  /** Trailing cells; without them the label spans the whole row. */
  children?: ReactNode;
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
        "relative col-span-full grid h-8 grid-cols-subgrid items-center",
        inCard ? "mt-2" : "mb-0.5 [--table-lead-bg:var(--section)]",
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
            : "max-md:sticky max-md:left-0 max-md:z-(--z-table-lead) max-md:in-data-scrolled:bg-[var(--table-lead-bg,var(--panel))] max-md:in-data-scrolled:shadow-[-0.5rem_0_0_var(--table-lead-bg,var(--panel)),var(--border-width-hairline)_0_0_var(--border-1)]",
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

export type TableGroupCellProps = ComponentProps<"div">;

export function TableGroupCell({ className, ...props }: TableGroupCellProps) {
  return (
    <div
      role="cell"
      className={cx(
        "relative flex min-w-0 items-center pr-4 text-xs font-medium text-muted-foreground-1 max-md:min-w-auto",
        className,
      )}
      {...props}
    />
  );
}

export type TableRowProps = ComponentProps<"div"> & {
  /** Hover band behind the row. Defaults to true. */
  interactive?: boolean;
};

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
          "before:absolute before:inset-y-0 before:-inset-x-2 before:rounded before:transition-colors before:duration-(--duration-hover) hover:before:bg-section",
        className,
      )}
      {...props}
    />
  );
}

export type TableCellProps = ComponentProps<"div"> & {
  /** The row's title cell: foreground colour, no wrapping. */
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
        stickyLead,
        className,
      )}
      {...props}
    />
  );
}

export type TableActionRowProps = Omit<
  useRender.ComponentProps<"button">,
  "className"
> & {
  className?: string;
  icon?: ReactNode;
  /** Renders the row as a router link. */
  to?: NonNullable<LinkProps["to"]>;
};

export function TableActionRow({
  icon,
  to,
  render,
  className,
  children,
  ...props
}: TableActionRowProps) {
  const target = to === undefined ? render : <Link to={to} />;
  return useRender({
    defaultTagName: "button",
    render: target,
    props: mergeProps<"button">(
      {
        type: target === undefined ? "button" : undefined,
        className: cx(
          "group relative mx-4 flex h-8 w-[calc(100%-2rem)] cursor-pointer items-center gap-2 text-left text-xs font-medium text-muted-foreground-1 outline-none select-none",
          "hover:text-foreground focus-visible:outline-ring-inset",
          "pointer-coarse:after:absolute pointer-coarse:after:top-1/2 pointer-coarse:after:left-1/2 pointer-coarse:after:size-full pointer-coarse:after:min-h-11 pointer-coarse:after:min-w-11 pointer-coarse:after:-translate-x-1/2 pointer-coarse:after:-translate-y-1/2",
          className,
        ),
        children: (
          <>
            <span className="absolute inset-y-0 -inset-x-2 rounded-(--radius-card) bg-section transition-colors duration-(--duration-hover) group-hover:bg-secondary" />
            <span className="relative flex size-(--icon-base) shrink-0 items-center justify-center [&_svg:not([class*='size-'])]:size-(--icon-base)">
              {icon}
            </span>
            <span className="relative min-w-0 flex-1 truncate">{children}</span>
            <Icon
              name="chevron-right-small"
              size={null}
              className="relative size-(--icon-sm) shrink-0 text-muted-foreground-3 group-hover:text-foreground"
            />
          </>
        ),
      },
      props,
    ),
  });
}
