import type { ComponentProps } from "react";

export type SidebarThreadRowProps = ComponentProps<"div">;

export function SidebarThreadRow(props: SidebarThreadRowProps) {
  return <div data-slot="sidebar-thread-row" {...props} />;
}
