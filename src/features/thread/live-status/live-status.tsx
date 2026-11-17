import type { ComponentProps, ReactNode } from "react";
import { ProgressEdge } from "@/primitives/progress-edge";
import { formatDuration } from "./format-duration";
import { RollingNumber } from "./rolling-number";

export type LiveStatusProps = Omit<ComponentProps<"span">, "children"> & {
  lead?: ReactNode;
  word?: ReactNode;
  wordWidth?: string;
  clock?: ReactNode;
};

export function LiveStatus({
  lead,
  word,
  wordWidth,
  clock,
  className,
  ...props
}: LiveStatusProps) {
  const leadNode = (
    <span className="peer flex min-w-0 items-center gap-1.5 empty:hidden">
      {lead}
    </span>
  );
  const wordNode = (
    <span className="shrink-0 whitespace-pre peer-[:not(:empty)]:before:content-['_']">
      {word}
    </span>
  );
  if (lead !== undefined) {
    return (
      <span
        data-slot="live-status"
        className={className ?? "flex min-w-0 items-center tabular-nums"}
        {...props}
      >
        <span className="flex min-w-0 items-center">
          {leadNode}
          {wordNode}
        </span>
        <span className="flex shrink-0 items-center gap-1.5 empty:hidden">
          {clock}
        </span>
      </span>
    );
  }
  return (
    <span
      data-slot="live-status"
      className={
        className ??
        "grid min-w-0 grid-cols-[minmax(0,1fr)_auto_auto_minmax(0,1fr)] items-center tabular-nums"
      }
      {...props}
    >
      <span className="col-[1/3] row-1 flex min-w-0 items-center justify-end">
        {leadNode}
        {wordNode}
      </span>
      <span aria-hidden className="invisible col-2 row-1 whitespace-pre">
        {wordWidth}
      </span>
      <span aria-hidden className="invisible col-3 row-1 whitespace-pre">
        {`for ${0}s`.padStart(7)}
      </span>
      <span className="col-[3/5] row-1 flex min-w-0 items-center gap-1.5 justify-self-start empty:hidden">
        {clock}
      </span>
    </span>
  );
}

export type ElapsedForProps = { ms: number; className?: string };

export function ElapsedFor({ ms, className }: ElapsedForProps) {
  return (
    <span className={className}>
      {" for "}
      <RollingNumber value={formatDuration(Math.max(1000, ms))} />
    </span>
  );
}

export const elapsedEnter =
  "motion-safe:transition-opacity motion-safe:duration-fast motion-safe:ease-out-quint motion-safe:starting:opacity-0";

export type WorkProgressEdgeProps = { active: boolean };

export function WorkProgressEdge({ active }: WorkProgressEdgeProps) {
  return (
    <ProgressEdge
      aria-hidden
      data-active={active}
      className={`progress-edge pointer-events-none absolute inset-x-0 top-0 z-(--z-top-bar) h-px bg-(--primary-soft) transition-opacity delay-fast duration-fast ease-out ${active ? "opacity-100" : "opacity-0"}`}
    />
  );
}
