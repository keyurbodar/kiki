import { cx } from "class-variance-authority";
import type { ComponentProps } from "react";
import { layoutSegments, type MeterSegment, type MeterTone } from "./format";

export const meterToneClass: Record<MeterTone, string> = {
  primary: "bg-primary",
  neutral: "bg-muted-foreground-2",
  warning: "bg-warning",
  danger: "bg-destructive",
  success: "bg-success",
  info: "bg-info",
  purple: "bg-purple",
  orange: "bg-orange",
  pink: "bg-pink",
};

export type MeterBarProps = Omit<ComponentProps<"div">, "children"> & {
  segments: ReadonlyArray<MeterSegment>;
  track?: "neutral" | "warning";
};

/** Capy's segmented usage bar (shared by the context meter and machine disk usage). */
export function MeterBar({
  segments,
  track = "neutral",
  className,
  ...props
}: MeterBarProps) {
  return (
    <div
      className={cx(
        "flex h-1.5 w-full overflow-hidden rounded-full",
        track === "warning" ? "bg-warning/30" : "bg-secondary",
        className,
      )}
      {...props}
    >
      {layoutSegments(segments).map((segment, index) =>
        segment.width === 0 ? null : (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: segments are positional, as in Capy
            key={index}
            className={cx("h-full", meterToneClass[segment.tone])}
            style={{ width: `${segment.width * 100}%` }}
          />
        ),
      )}
    </div>
  );
}
