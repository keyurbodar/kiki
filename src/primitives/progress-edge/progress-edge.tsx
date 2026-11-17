import type { ComponentProps } from "react";

export type ProgressEdgeProps = ComponentProps<"div">;

export function ProgressEdge(props: ProgressEdgeProps) {
  return <div data-slot="progress-edge" {...props} />;
}
