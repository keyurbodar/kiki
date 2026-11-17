import type { ComponentProps } from "react";

export type DiffSurfaceProps = ComponentProps<"div">;

export function DiffSurface(props: DiffSurfaceProps) {
  return <div data-slot="diff-surface" {...props} />;
}
