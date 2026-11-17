import type { ComponentProps } from "react";

export type FabricViewportHostProps = ComponentProps<"div">;

export function FabricViewportHost(props: FabricViewportHostProps) {
  return <div data-slot="fabric-viewport-host" {...props} />;
}
