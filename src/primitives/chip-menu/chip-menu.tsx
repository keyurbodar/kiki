import { Menu as BaseMenu } from "@base-ui/react/menu";
import type { ComponentProps } from "react";

export const ChipMenu = BaseMenu.Root;

export type ChipMenuProps = ComponentProps<typeof BaseMenu.Root>;

export type ChipMenuTriggerProps = ComponentProps<typeof BaseMenu.Trigger>;

export function ChipMenuTrigger(props: ChipMenuTriggerProps) {
  return <BaseMenu.Trigger data-slot="menu-trigger" {...props} />;
}
