import type { ComponentProps } from "react";

export type SidebarWrapperProps = ComponentProps<"div">;

export function SidebarWrapper(props: SidebarWrapperProps) {
  return <div data-slot="sidebar-wrapper" {...props} />;
}

export type SidebarContainerProps = ComponentProps<"div">;

export function SidebarContainer(props: SidebarContainerProps) {
  return <div data-slot="sidebar-container" {...props} />;
}

export type SidebarGapProps = ComponentProps<"div">;

export function SidebarGap(props: SidebarGapProps) {
  return <div data-slot="sidebar-gap" {...props} />;
}

export type SidebarRailProps = ComponentProps<"div">;

export function SidebarRail(props: SidebarRailProps) {
  return <div data-slot="sidebar-rail" {...props} />;
}

export type SidebarPanelProps = ComponentProps<"div">;

export function SidebarPanel(props: SidebarPanelProps) {
  return <div data-slot="sidebar-panel" {...props} />;
}

export type SidebarContentProps = ComponentProps<"div">;

export function SidebarContent(props: SidebarContentProps) {
  return <div data-slot="sidebar-content" {...props} />;
}
