import type { ComponentProps } from "react";

export type CrashSurfaceProps = ComponentProps<"div">;

export function CrashSurface(props: CrashSurfaceProps) {
  return <div {...props} />;
}
