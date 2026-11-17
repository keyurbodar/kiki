import type { ComponentProps } from "react";

export type VirtualListProps = ComponentProps<"div">;

export function VirtualList(props: VirtualListProps) {
  return <div data-slot="virtual-list" {...props} />;
}
