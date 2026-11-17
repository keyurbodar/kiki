import { Collapsible as BaseCollapsible } from "@base-ui/react/collapsible";
import type { ComponentProps } from "react";

export type CollapsibleProps = ComponentProps<typeof BaseCollapsible.Root>;

export function Collapsible(props: CollapsibleProps) {
  return <BaseCollapsible.Root data-slot="collapsible" {...props} />;
}

export type CollapsibleTriggerProps = ComponentProps<
  typeof BaseCollapsible.Trigger
>;

export function CollapsibleTrigger(props: CollapsibleTriggerProps) {
  return <BaseCollapsible.Trigger data-slot="collapsible-trigger" {...props} />;
}

export type CollapsiblePanelProps = ComponentProps<
  typeof BaseCollapsible.Panel
>;

export function CollapsiblePanel(props: CollapsiblePanelProps) {
  return <BaseCollapsible.Panel data-slot="collapsible-panel" {...props} />;
}
