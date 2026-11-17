import type { ComponentProps } from "react";

export type SkeletonPanelProps = ComponentProps<"div">;

export function SkeletonPanel(props: SkeletonPanelProps) {
  return <div data-slot="skeleton-panel" {...props} />;
}
