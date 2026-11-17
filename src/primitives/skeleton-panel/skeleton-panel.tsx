import { cx } from "class-variance-authority";
import type { ComponentProps } from "react";
import { motion } from "@/lib/motion";

export type SkeletonPanelProps = ComponentProps<"div"> & {
  /** Announced to screen readers while the placeholder shows. */
  label?: string;
};

export function SkeletonPanel({
  label = "Loading",
  children,
  ...props
}: SkeletonPanelProps) {
  return (
    <div data-slot="skeleton-panel" {...props}>
      <div
        role="status"
        aria-live="polite"
        aria-busy="true"
        className="sr-only"
      >
        {label}
      </div>
      <div aria-hidden className="contents">
        {children}
      </div>
    </div>
  );
}

/** SkeletonPanel that fades in after a short delay and pulses its children. */
export function SkeletonPulse({
  className,
  children,
  ...props
}: SkeletonPanelProps) {
  return (
    <SkeletonPanel className={cx(motion.delayedReveal, className)} {...props}>
      <div className={motion.skeletonPulse}>{children}</div>
    </SkeletonPanel>
  );
}
