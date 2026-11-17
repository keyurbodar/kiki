import type { ReactNode } from "react";
import { SkeletonPanel } from "@/primitives/skeleton-panel";

const aria = (role: string) => ({ role });

const columnsStyle = (columns: string) =>
  ({ gridTemplateColumns: columns }) as React.CSSProperties;

export const col = (units: number) => `calc(var(--spacing) * ${units})`;

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
    <div
      {...aria("rowgroup")}
      className="grid items-center px-4"
      style={columnsStyle("var(--grid-columns)")}
    >
      {children}
    </div>
  );
}

export function GridHead({
  children,
  align = "start",
  sorted = false,
}: {
  children: ReactNode;
  align?: "start" | "end";
  sorted?: boolean;
}) {
  return (
    <div
      {...aria("columnheader")}
      data-sorted={sorted ? "" : undefined}
      className={[
        "flex min-h-8 min-w-0 items-center text-xs font-normal whitespace-nowrap",
        align === "end" ? "justify-end" : "",
        sorted ? "text-foreground" : "text-muted-foreground-1",
      ]
        .filter(Boolean)
        .join(" ")}
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
      className="grid items-center px-4"
      style={columnsStyle("var(--grid-columns)")}
    >
      {children}
    </div>
  );
}

export function GridGroup({
  cells,
  children,
}: {
  cells: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div {...aria("rowgroup")} className="flex flex-col">
      <div
        {...aria("row")}
        data-slot="grid-group"
        className="grid min-h-8 items-center rounded-(--radius-inner) bg-section px-4 [&>[role=cell]]:min-h-8"
        style={columnsStyle("var(--grid-columns)")}
      >
        {cells}
      </div>
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
    <div className="flex flex-col gap-3 px-4">
      {new Array(rows).fill(0).map((_, index) => (
        <SkeletonPanel key={`row-${String(index)}`} className="h-5 w-full" />
      ))}
    </div>
  );
}

export function ErrorNotice({ description }: { description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 px-4 py-10 text-center">
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
    <div className="flex items-center justify-center px-4 py-12 text-sm font-normal text-muted-foreground-2">
      {children}
    </div>
  );
}
