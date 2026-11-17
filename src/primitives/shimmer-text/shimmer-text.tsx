import type { ComponentProps } from "react";

export type ShimmerTextProps = ComponentProps<"span">;

export function ShimmerText(props: ShimmerTextProps) {
  return <span data-slot="shimmer-text" {...props} />;
}
