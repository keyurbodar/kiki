import { Menu as BaseMenu } from "@base-ui/react/menu";
import type { ComponentProps } from "react";

export const InheritedMenu = BaseMenu.Root;

export type InheritedMenuProps = ComponentProps<typeof BaseMenu.Root>;

export type InheritedMenuTriggerProps = ComponentProps<typeof BaseMenu.Trigger>;

export function InheritedMenuTrigger(props: InheritedMenuTriggerProps) {
  return <BaseMenu.Trigger data-slot="menu-trigger" {...props} />;
}
