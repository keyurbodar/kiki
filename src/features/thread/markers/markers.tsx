import { cx } from "class-variance-authority";
import type { Schema } from "effect";
import type { ComponentProps, ReactNode } from "react";
import type { MarkerRow as MarkerRowSchema } from "@/data/events";

import { Icon, type IconId } from "@/primitives/icon";
import { ShimmerText } from "@/primitives/shimmer-text";

type MarkerRowData = Schema.Schema.Type<typeof MarkerRowSchema>;

export type MarkerRowProps = ComponentProps<"div">;

export function MarkerRow(props: MarkerRowProps) {
  return <div data-slot="marker-row" {...props} />;
}

const markerIcons: Partial<Record<MarkerRowData["kind"], IconId>> = {
  archive: "archive",
  captain: "user",
  crew: "people-add",
  fork: "branch",
  handoff: "cloud",
  issues: "circle-dashed",
  machine: "devices",
  offline: "devices",
  permission: "key-2",
  review: "commits",
  retry: "arrow-rotate-clockwise",
  return: "devices",
  setup: "exclamation-triangle",
  switch: "arrows-repeat-right-left",
  takeover: "user-add-right",
};

const plainKinds = new Set<MarkerRowData["kind"]>([
  "compaction",
  "environment",
  "permission",
]);

export type MarkerIconProps = {
  kind: MarkerRowData["kind"];
  className?: string;
};

export function MarkerIcon({ kind, className }: MarkerIconProps) {
  const name = markerIcons[kind];
  return name === undefined ? null : <Icon name={name} className={className} />;
}

export type MarkerDividerProps = Omit<ComponentProps<"div">, "children"> & {
  row: MarkerRowData;
  label?: ReactNode;
  needsYou?: boolean;
};

/** Capy's centred marker: two rules around the label, or a plain line for the in-flight kinds. */
export function MarkerDivider({
  row,
  label,
  needsYou = false,
  className,
  ...props
}: MarkerDividerProps) {
  const text = label ?? row.label;
  if (plainKinds.has(row.kind)) {
    return (
      <div className={cx("flex flex-col items-center", className)} {...props}>
        <span className="flex w-fit max-w-[86%] min-w-0 items-center justify-center py-1 text-xs font-normal text-muted-foreground-2 md:max-w-[80%]">
          {row.live === true ? (
            <ShimmerText className="min-w-0 truncate">{text}</ShimmerText>
          ) : (
            <span className="min-w-0 truncate">{text}</span>
          )}
        </span>
      </div>
    );
  }
  const rule =
    "w-[clamp(0,calc((100%-var(--spacing)*6)*9999),100%)] border-t-[length:--spacing(0.125)] border-border-2 motion-safe:transition-[scale] motion-safe:duration-base motion-safe:ease-out-quint";
  return (
    <div
      className={cx("flex min-h-7 w-full items-center gap-3", className)}
      {...props}
    >
      <span aria-hidden className="flex min-w-0 flex-1 justify-end">
        <span className={rule} />
      </span>
      <span
        title={row.title}
        className={cx(
          "flex min-w-0 items-center gap-1 text-xs font-medium whitespace-nowrap",
          row.kind === "new" ? "text-primary-ink" : "text-muted-foreground-2",
          needsYou && "text-foreground",
        )}
      >
        <MarkerIcon
          kind={row.kind}
          className="mr-1 inline size-3 shrink-0 align-[-0.115em]"
        />
        {row.live === true ? (
          <ShimmerText className="min-w-0 truncate">{text}</ShimmerText>
        ) : (
          <span className="min-w-0 truncate">{text}</span>
        )}
      </span>
      <span aria-hidden className="flex min-w-0 flex-1">
        <span className={rule} />
      </span>
    </div>
  );
}

export type WaitingSource = {
  id: string;
  kind: "text" | "check" | "crew" | "task";
  text: string;
  label?: string;
};

const DOT_GRID = [3, 7, 11].flatMap((y) => [3, 7, 11].map((x) => [x, y]));

/** Capy's waiting marker leads with a 3x3 grid of dots in the primary ink. */
function DotGrid() {
  return (
    <svg
      aria-hidden
      fill="currentColor"
      viewBox="0 0 14 14"
      className="dot-grid mr-1 inline-block size-(--icon-sm) shrink-0 align-[-0.2em] text-primary-ink"
    >
      {DOT_GRID.map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={1} />
      ))}
    </svg>
  );
}

export type WaitingMarkerProps = Omit<ComponentProps<"div">, "children"> & {
  sources?: readonly WaitingSource[];
  needsYou?: boolean;
  enter?: boolean;
  onDismiss?: () => void;
  onOpenSource?: (source: WaitingSource) => void;
};

/** The centred waiting line Capy shows above the next turn. */
export function WaitingMarker({
  sources = [],
  needsYou = false,
  enter = false,
  onDismiss,
  onOpenSource,
  className,
  ...props
}: WaitingMarkerProps) {
  return (
    <div
      data-slot="waiting-marker"
      className={cx("flex w-full items-start justify-center", className)}
      {...props}
    >
      <span
        className={cx(
          "max-w-[86%] min-w-0 py-1.5 text-center text-xs md:max-w-[80%]",
          needsYou
            ? "font-medium text-foreground"
            : "font-normal text-muted-foreground-2",
          enter &&
            "motion-safe:transition-opacity motion-safe:duration-waiting-in motion-safe:delay-waiting-in motion-safe:ease-out-quint motion-safe:starting:opacity-0",
        )}
      >
        <DotGrid />
        {sources.length === 0
          ? needsYou
            ? "Needs you"
            : "Waiting"
          : sources.map((source, index) => (
              <span key={source.id}>
                {index > 0 ? <span aria-hidden> · </span> : null}
                {onOpenSource === undefined ? (
                  source.text
                ) : (
                  <button
                    type="button"
                    className="cursor-pointer rounded-sm text-(--text-link) outline-none hover:underline focus-visible:outline-ring-inset"
                    onClick={() => onOpenSource(source)}
                  >
                    {source.label ?? source.text}
                  </button>
                )}
              </span>
            ))}
        {onDismiss === undefined ? null : (
          <button
            type="button"
            onClick={onDismiss}
            className="ml-2 cursor-pointer font-normal text-muted-foreground-2 transition-colors duration-hover hover:text-foreground focus-visible:outline-ring-inset"
          >
            Dismiss
          </button>
        )}
      </span>
    </div>
  );
}
