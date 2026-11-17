import { cx } from "class-variance-authority";
import type { CSSProperties } from "react";

const surface = {
  "--shimmer-surface-base": "var(--card-hover)",
  "--shimmer-surface-gradient": "var(--gradient-skeleton)",
} as CSSProperties;

export function SkeletonBar({ className }: { className?: string }) {
  return (
    <div
      className={cx(
        "shimmer-surface shimmer-surface-motion-safe rounded",
        className,
      )}
      style={surface}
    />
  );
}
