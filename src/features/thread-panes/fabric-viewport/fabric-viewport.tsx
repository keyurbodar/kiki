import type { ComponentProps } from "react";

export type FabricViewportHostProps = ComponentProps<"div">;

export function FabricViewportHost({ ...props }: FabricViewportHostProps) {
  return <div data-slot="fabric-viewport-host" {...props} />;
}

export function constrainViewportScale(
  natural: { readonly width: number; readonly height: number },
  available: { readonly width: number; readonly height: number },
): number {
  if (natural.width <= 0 || natural.height <= 0) return 1;
  return Math.min(
    available.width / natural.width,
    available.height / natural.height,
  );
}
