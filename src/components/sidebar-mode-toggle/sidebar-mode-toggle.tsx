import type { ComponentProps } from "react";

export type SidebarModeToggleProps = ComponentProps<"div">;

export function SidebarModeToggle(props: SidebarModeToggleProps) {
  return <div data-slot="sidebar-mode" {...props} />;
}
