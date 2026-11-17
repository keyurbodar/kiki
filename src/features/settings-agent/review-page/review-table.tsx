import { cva, type VariantProps } from "class-variance-authority";
import {
  type ComponentProps,
  createContext,
  type UIEvent,
  useContext,
} from "react";
import { Card } from "@/primitives/card";

const cx = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ");

const fluidTrack = /^minmax\(\s*0\s*,(.+)\)$/;
const autoTrack = /^minmax\((.+),\s*auto\s*\)$/;

/**
 * Capy's table column normalisation: fluid tracks get a minimum on small
 * screens and fixed minimums of auto tracks become overridable.
 */
export const tableColumns = (tracks: ReadonlyArray<string>) =>
  tracks
    .map((track, index) => {
      const fluid = fluidTrack.exec(track);
      if (fluid !== null)
        return `minmax(var(${index === 0 ? "--table-lead-min" : "--table-fluid-min"}),${fluid[1]})`;
      const auto = autoTrack.exec(track);
      if (auto !== null && auto[1] !== "0")
        return `minmax(var(--table-auto-min,${auto[1]}),auto)`;
      return track;
    })
    .join(" ");

/** A track whose minimum is n spacing units. */
export const spacing = (n: number) => `calc(var(--spacing)*${n})`;

export const reviewTableVariants = cva(
  "isolate grid w-full overflow-x-auto overscroll-x-contain px-4 [--table-fluid-min:0] [--table-lead-min:0] max-md:[--table-fluid-min:8rem] max-md:[--table-lead-min:10rem] max-md:[--table-auto-min:auto] max-md:[clip-path:inset(0_0_0_0.5rem)]",
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

const leadCell =
  "max-md:min-w-auto max-md:first:sticky max-md:first:left-0 max-md:first:z-(--z-table-lead) max-md:in-data-scrolled:first:bg-[var(--table-lead-bg,var(--panel))] max-md:in-data-scrolled:first:shadow-[calc(var(--spacing)*-2)_0_0_var(--table-lead-bg,var(--panel)),var(--border-width-hairline)_0_0_var(--border-1)]";

const InCard = createContext(false);

export type ReviewTableProps = Omit<ComponentProps<"div">, "children"> &
  VariantProps<typeof reviewTableVariants> & {
    columns: ReadonlyArray<string>;
    card?: boolean;
    cardClassName?: string;
    children?: ComponentProps<"div">["children"];
  };

export function ReviewTable({
  columns,
  density,
  card = false,
  cardClassName,
  className,
  onScroll,
  style,
  ...props
}: ReviewTableProps) {
  const table = (
    // biome-ignore lint/a11y/useSemanticElements: Capy's table is a CSS grid of divs with ARIA table roles
    <div
      role="table"
      data-slot="table"
      style={{ ...style, gridTemplateColumns: tableColumns(columns) }}
      className={reviewTableVariants({
        density,
        className: cx(card && "[--table-lead-bg:var(--card)]", className),
      })}
      onScroll={(event: UIEvent<HTMLDivElement>) => {
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
    <InCard.Provider value>
      <Card className={cx("py-2", cardClassName)}>{table}</Card>
    </InCard.Provider>
  );
}

export function ReviewTableHeader({
  className,
  ...props
}: ComponentProps<"div">) {
  const filled = useContext(InCard);
  return (
    // biome-ignore lint/a11y/useSemanticElements: Capy's table is a CSS grid of divs with ARIA table roles
    // biome-ignore lint/a11y/useFocusableInteractive: Capy's table is a CSS grid of divs with ARIA table roles
    <div
      role="row"
      className={cx(
        "col-span-full grid h-8 grid-cols-subgrid items-center",
        filled &&
          "relative mb-0.5 [--table-lead-bg:var(--section)] before:absolute before:inset-y-0 before:-inset-x-2 before:rounded-(--radius-card) before:bg-section [&>*]:relative",
        className,
      )}
      {...props}
    />
  );
}

export function ReviewTableHead({
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    // biome-ignore lint/a11y/useSemanticElements: Capy's table is a CSS grid of divs with ARIA table roles
    // biome-ignore lint/a11y/useFocusableInteractive: Capy's table is a CSS grid of divs with ARIA table roles
    <div
      role="columnheader"
      className={cx(
        "flex min-w-0 items-center gap-0.5 pr-4 text-xs font-normal whitespace-nowrap text-muted-foreground-1 select-none",
        leadCell,
        className,
      )}
      {...props}
    />
  );
}

export type ReviewTableRowProps = ComponentProps<"div"> & {
  interactive?: boolean;
};

export function ReviewTableRow({
  interactive = true,
  className,
  ...props
}: ReviewTableRowProps) {
  return (
    // biome-ignore lint/a11y/useSemanticElements: Capy's table is a CSS grid of divs with ARIA table roles
    // biome-ignore lint/a11y/useFocusableInteractive: Capy's table is a CSS grid of divs with ARIA table roles
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

export function ReviewTableCell({
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    // biome-ignore lint/a11y/useSemanticElements: Capy's table is a CSS grid of divs with ARIA table roles
    <div
      role="cell"
      className={cx(
        "relative flex min-h-[var(--table-row-h,calc(var(--spacing)*12.5))] min-w-0 items-center pr-4 text-xs font-normal text-muted-foreground-1",
        leadCell,
        className,
      )}
      {...props}
    />
  );
}
