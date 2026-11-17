import type { ComponentProps } from "react";

export type AppSidebarProps = ComponentProps<"div">;

export function AppSidebar(props: AppSidebarProps) {
  return <div {...props} />;
}
