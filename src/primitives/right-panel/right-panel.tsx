import type { ComponentProps } from "react";

export type RightPanelProps = ComponentProps<"aside">;

export function RightPanel(props: RightPanelProps) {
  return <aside data-slot="right-panel" {...props} />;
}

export type RightPanelRailProps = ComponentProps<"div">;

export function RightPanelRail(props: RightPanelRailProps) {
  return <div data-slot="right-panel-rail" {...props} />;
}

export type RightPanelContentProps = ComponentProps<"div">;

export function RightPanelContent(props: RightPanelContentProps) {
  return <div data-slot="right-panel-content" {...props} />;
}

export type RightPanelGroupProps = ComponentProps<"section">;

export function RightPanelGroup(props: RightPanelGroupProps) {
  return <section data-slot="right-panel-group" {...props} />;
}
