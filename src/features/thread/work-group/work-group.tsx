import type { ComponentProps } from "react";

export type WorkGroupPanelProps = ComponentProps<"div">;

export function WorkGroupPanel(props: WorkGroupPanelProps) {
  return <div data-slot="work-group-panel" {...props} />;
}

export type WorkGroupPreviewProps = ComponentProps<"div">;

export function WorkGroupPreview(props: WorkGroupPreviewProps) {
  return <div data-slot="work-group-preview" {...props} />;
}
