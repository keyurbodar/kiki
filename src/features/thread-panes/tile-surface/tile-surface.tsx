import type { ComponentProps } from "react";

export type TileSurfaceProps = ComponentProps<"div">;

export function TileSurface(props: TileSurfaceProps) {
  return <div {...props} />;
}
