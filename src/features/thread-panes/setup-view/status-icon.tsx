import { cx } from "class-variance-authority";
import { Icon } from "@/primitives/icon";
import { ClockGlyph } from "./glyphs";
import type { StatusBucket } from "./logic";

/** Capy's status bucket glyph (shared/status-icon), local until a shared one lands. */
export function StatusBucketIcon({
  bucket,
  className,
}: {
  bucket: StatusBucket;
  className?: string;
}) {
  switch (bucket) {
    case "attention":
      return (
        <Icon
          name="exclamation-circle"
          data-bucket={bucket}
          className={cx(
            "size-(--icon-sm) shrink-0 text-destructive",
            className,
          )}
        />
      );
    case "review":
      return (
        <Icon
          name="check-circle-2"
          data-bucket={bucket}
          className={cx("size-(--icon-sm) shrink-0 text-success", className)}
        />
      );
    case "active":
      return (
        <Icon
          name="progress-50"
          data-bucket={bucket}
          className={cx("size-(--icon-sm) shrink-0 text-progress", className)}
        />
      );
    case "waiting":
      return (
        <ClockGlyph
          data-bucket={bucket}
          className={cx(
            "size-(--icon-sm) shrink-0 text-muted-foreground-2",
            className,
          )}
        />
      );
    case "idle":
      return (
        <svg
          viewBox="0 0 14 14"
          aria-hidden
          data-bucket={bucket}
          className={cx(
            "size-(--icon-sm) shrink-0 text-muted-foreground-3",
            className,
          )}
        >
          <circle
            cx="7"
            cy="7"
            r="5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.25"
          />
        </svg>
      );
  }
}

export const dotsIcon = "size-(--icon-xs)";
