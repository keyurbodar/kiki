import type { ComponentProps } from "react";

export type SettingsSidebarProps = ComponentProps<"nav">;

export function SettingsSidebar(props: SettingsSidebarProps) {
  return <nav {...props} />;
}
