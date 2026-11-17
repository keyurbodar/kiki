import { Menu as BaseMenu } from "@base-ui/react/menu";
import type { ComponentProps } from "react";

export type StatusTriggerProps = ComponentProps<typeof BaseMenu.Trigger>;

export function StatusTrigger(props: StatusTriggerProps) {
  return <BaseMenu.Trigger data-slot="menu-trigger" {...props} />;
}
