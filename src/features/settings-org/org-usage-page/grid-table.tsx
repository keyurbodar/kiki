import type { ReactNode } from "react";
import { SkeletonPanel } from "@/primitives/skeleton-panel";

/**
 * Capy's grid table is a div tree with ARIA roles and a shared column template,
 * so roles come from a helper rather than inline literals.
 */
const aria = (role: string) => ({ role });

export const G = (units: number) => `calc(var(--spacing) * ${units})`;

export function GridTable({
  columns,
  children,
}: {
  columns: string;
  children: ReactNode;
}) {
  return (
    <div
      {...aria("table")}
      data-slot="grid-table"
      className="flex flex-col"
      style={{ ["--grid-columns" as string]: columns }}
    >
      {children}
    </div>
  );
}

export function GridRowGroup({ children }: { children: ReactNode }) {
  return (
    <div {...aria("rowgroup")} className="grid grid-cols-subgrid items-center">
      {children}
    </div>
  );
}

export function GridHead({ children }: { children: ReactNode }) {
  return (
    <div
      {...aria("columnheader")}
      className="flex min-h-8 min-w-0 items-center text-xs font-normal whitespace-nowrap text-muted-foreground-1"
    >
      {children}
    </div>
  );
}

export function GridRow({ children }: { children: ReactNode }) {
  return (
    <div
      {...aria("row")}
      data-slot="grid-row"
      className="grid items-center border-b border-border-1 last:border-b-0 hover:bg-section"
      style={{ gridTemplateColumns: "var(--grid-columns)" }}
    >
      {children}
    </div>
  );
}

export function GridGroup({ children }: { children: ReactNode }) {
  return (
    <div
      {...aria("row")}
      className="col-span-full grid grid-cols-subgrid bg-section"
    >
      {children}
    </div>
  );
}

export function GridCell({
  children,
  align = "start",
  lead = false,
  className = "",
}: {
  children?: ReactNode;
  align?: "start" | "end";
  lead?: boolean;
  className?: string;
}) {
  return (
    <div
      {...aria("cell")}
      data-lead={lead ? "" : undefined}
      className={[
        "flex min-h-11 min-w-0 items-center gap-2.5 py-1 text-xs font-normal text-muted-foreground-1",
        align === "end" ? "justify-end tabular-nums whitespace-nowrap" : "",
        lead ? "text-foreground" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}

export function LoadingRows({ rows = 3 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-3 p-4">
      {new Array(rows).fill(0).map((_, index) => (
        <SkeletonPanel key={`row-${String(index)}`} className="h-5 w-full" />
      ))}
    </div>
  );
}

export function ErrorNotice({ description }: { description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 p-10 text-center">
      <span className="text-sm font-medium text-foreground">
        Usage analytics is temporarily unavailable
      </span>
      <span className="text-xs font-normal text-muted-foreground-2">
        {description ?? "Totals stay live, charts return shortly"}
      </span>
    </div>
  );
}

export function EmptyNotice({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center justify-center py-12 text-sm font-normal text-muted-foreground-2">
      {children}
    </div>
  );
}
