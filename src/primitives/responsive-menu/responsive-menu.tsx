import { Menu as BaseMenu } from "@base-ui/react/menu";
import type { ComponentProps } from "react";

export const ResponsiveMenu = BaseMenu.Root;

export type ResponsiveMenuProps = ComponentProps<typeof BaseMenu.Root>;

export type ResponsiveMenuLevelProps = ComponentProps<"div">;

export function ResponsiveMenuLevel(props: ResponsiveMenuLevelProps) {
  return <div data-slot="responsive-menu-level" {...props} />;
}

export type ResponsiveMenuItemProps = ComponentProps<typeof BaseMenu.Item>;

export function ResponsiveMenuItem(props: ResponsiveMenuItemProps) {
  return <BaseMenu.Item data-slot="responsive-menu-item" {...props} />;
}

export type ResponsiveMenuCheckboxItemProps = ComponentProps<
  typeof BaseMenu.CheckboxItem
>;

export function ResponsiveMenuCheckboxItem(
  props: ResponsiveMenuCheckboxItemProps,
) {
  return (
    <BaseMenu.CheckboxItem
      data-slot="responsive-menu-checkbox-item"
      {...props}
    />
  );
}
