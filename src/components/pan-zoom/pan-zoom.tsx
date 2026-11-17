import type { ComponentProps } from "react";

export type PanZoomProps = ComponentProps<"div">;

export function PanZoom(props: PanZoomProps) {
  return <div {...props} />;
}
