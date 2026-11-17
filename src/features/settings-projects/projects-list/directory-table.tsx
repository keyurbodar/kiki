import type { ComponentProps, CSSProperties, ReactNode } from "react";
import { cx } from "../shared/cx";
import { Glyph } from "../shared/glyphs";

const leadCell =
  "max-md:min-w-auto max-md:first:sticky max-md:first:left-0 max-md:first:z-(--z-table-lead) max-md:in-data-scrolled:first:bg-[var(--table-lead-bg,var(--panel))] max-md:in-data-scrolled:first:shadow-[-0.5rem_0_0_var(--table-lead-bg,var(--panel)),0.03125rem_0_0_var(--border-1)]";

/** Capy's directory table (ui/table, density "directory"): a CSS grid with subgrid rows. */
export function DirectoryTable({
  columns,
  children,
}: {
  readonly columns: string;
  readonly children: ReactNode;
}) {
  return (
    // biome-ignore lint/a11y/useSemanticElements: Capy's table is a CSS grid with subgrid rows, which native table elements cannot host
    <div
      role="table"
      className="isolate grid w-full overflow-x-auto overscroll-x-contain px-4 [--table-row-h:--spacing(12.5)] max-md:[--table-fluid-min:8rem] max-md:[--table-lead-min:10rem] max-md:[--table-auto-min:auto] max-md:[clip-path:inset(0_0_0_0.5rem)]"
      style={{ gridTemplateColumns: columns } as CSSProperties}
    >
      {children}
    </div>
  );
}

export function DirectoryHeaderRow({
  children,
}: {
  readonly children: ReactNode;
}) {
  return (
    // biome-ignore lint/a11y/useSemanticElements: Capy's table is a CSS grid with subgrid rows, which native table elements cannot host
    // biome-ignore lint/a11y/useFocusableInteractive: rows and headers are not focus targets in Capy's directory table
    <div
      role="row"
      className="col-span-full grid h-8 grid-cols-subgrid items-center"
    >
      {children}
    </div>
  );
}

export function DirectoryColumnHeader({
  sorted,
  children,
  ...props
}: ComponentProps<"div"> & { readonly sorted?: boolean }) {
  return (
    // biome-ignore lint/a11y/useSemanticElements: Capy's table is a CSS grid with subgrid rows, which native table elements cannot host
    // biome-ignore lint/a11y/useFocusableInteractive: rows and headers are not focus targets in Capy's directory table
    <div
      role="columnheader"
      className={cx(
        "flex min-w-0 items-center gap-0.5 pr-4 text-xs font-normal whitespace-nowrap text-muted-foreground-1 select-none",
        leadCell,
      )}
      {...props}
    >
      {children}
      {sorted && (
        <Glyph name="arrow-down" className="size-3 shrink-0 text-foreground" />
      )}
    </div>
  );
}

export function DirectoryGroupRow({
  label,
  count,
}: {
  readonly label: string;
  readonly count?: number;
}) {
  return (
    // biome-ignore lint/a11y/useSemanticElements: Capy's table is a CSS grid with subgrid rows, which native table elements cannot host
    // biome-ignore lint/a11y/useFocusableInteractive: rows and headers are not focus targets in Capy's directory table
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

export function DirectoryRow({
  interactive = true,
  children,
}: {
  readonly interactive?: boolean;
  readonly children: ReactNode;
}) {
  return (
    // biome-ignore lint/a11y/useSemanticElements: Capy's table is a CSS grid with subgrid rows, which native table elements cannot host
    // biome-ignore lint/a11y/useFocusableInteractive: rows and headers are not focus targets in Capy's directory table
    <div
      role="row"
      className={cx(
        "relative col-span-full grid grid-cols-subgrid",
        interactive &&
          "before:absolute before:inset-y-0 before:-inset-x-2 before:rounded before:transition-colors before:duration-100 hover:before:bg-section",
      )}
    >
      {children}
    </div>
  );
}

export function DirectoryCell({ className, ...props }: ComponentProps<"div">) {
  return (
    // biome-ignore lint/a11y/useSemanticElements: Capy's table is a CSS grid with subgrid rows, which native table elements cannot host
    <div
      role="cell"
      className={cx(
        "relative flex min-h-(--table-row-h) min-w-0 items-center pr-4 text-xs font-normal text-muted-foreground-1",
        leadCell,
        className,
      )}
      {...props}
    />
  );
}

/** The full-width row under the table ("Don't see a repository? …"). */
export function DirectoryActionRow({
  icon,
  onClick,
  children,
}: {
  readonly icon: ReactNode;
  readonly onClick: () => void;
  readonly children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative mx-4 flex h-8 w-[calc(100%-2rem)] cursor-pointer items-center gap-2 text-left text-xs font-medium text-muted-foreground-1 outline-none select-none hover:text-foreground focus-visible:outline-ring-inset"
    >
      <span className="absolute inset-y-0 -inset-x-2 rounded-(--radius-card) bg-section transition-colors duration-100 group-hover:bg-secondary" />
      <span className="relative flex size-(--icon-base) shrink-0 items-center justify-center">
        {icon}
      </span>
      <span className="relative min-w-0 flex-1 truncate">{children}</span>
      <Glyph
        name="chevron-right"
        className="relative size-(--icon-sm) shrink-0 text-muted-foreground-3 group-hover:text-foreground"
      />
    </button>
  );
}
