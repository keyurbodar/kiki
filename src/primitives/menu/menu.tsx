import { Menu as BaseMenu } from "@base-ui/react/menu";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

export const menuRowVariants = cva("", {
  variants: {
    density: { default: "", rich: "", palette: "" },
    interaction: { highlight: "", button: "" },
    intent: { neutral: "", danger: "" },
  },
  defaultVariants: {
    density: "default",
    interaction: "highlight",
    intent: "neutral",
  },
});

export type MenuRowVariants = VariantProps<typeof menuRowVariants>;

export const Menu = BaseMenu.Root;

export type MenuProps = ComponentProps<typeof BaseMenu.Root>;

export const MenuSub = BaseMenu.SubmenuRoot;

export type MenuSubProps = ComponentProps<typeof BaseMenu.SubmenuRoot>;

export type MenuTriggerProps = ComponentProps<typeof BaseMenu.Trigger>;

export function MenuTrigger(props: MenuTriggerProps) {
  return <BaseMenu.Trigger data-slot="menu-trigger" {...props} />;
}

export type MenuContentProps = ComponentProps<typeof BaseMenu.Popup> &
  Pick<
    ComponentProps<typeof BaseMenu.Positioner>,
    "side" | "align" | "sideOffset" | "alignOffset"
  >;

export function MenuContent({
  side,
  align,
  sideOffset,
  alignOffset,
  ...props
}: MenuContentProps) {
  return (
    <BaseMenu.Portal>
      <BaseMenu.Positioner
        side={side}
        align={align}
        sideOffset={sideOffset}
        alignOffset={alignOffset}
      >
        <BaseMenu.Popup data-slot="menu-content" {...props} />
      </BaseMenu.Positioner>
    </BaseMenu.Portal>
  );
}

export type MenuItemProps = Omit<
  ComponentProps<typeof BaseMenu.Item>,
  "className"
> &
  MenuRowVariants & { className?: string };

export function MenuItem({
  density,
  interaction,
  intent,
  className,
  ...props
}: MenuItemProps) {
  return (
    <BaseMenu.Item
      data-slot="menu-item"
      className={menuRowVariants({ density, interaction, intent, className })}
      {...props}
    />
  );
}

export type MenuActionItemProps = MenuItemProps;

export function MenuActionItem({
  density,
  interaction,
  intent,
  className,
  ...props
}: MenuActionItemProps) {
  return (
    <BaseMenu.Item
      data-slot="menu-action-item"
      className={menuRowVariants({ density, interaction, intent, className })}
      {...props}
    />
  );
}

export type MenuCheckboxItemProps = Omit<
  ComponentProps<typeof BaseMenu.CheckboxItem>,
  "className"
> &
  MenuRowVariants & { className?: string };

export function MenuCheckboxItem({
  density,
  interaction,
  intent,
  className,
  ...props
}: MenuCheckboxItemProps) {
  return (
    <BaseMenu.CheckboxItem
      data-slot="menu-checkbox-item"
      className={menuRowVariants({ density, interaction, intent, className })}
      {...props}
    />
  );
}

export type MenuSubTriggerProps = ComponentProps<
  typeof BaseMenu.SubmenuTrigger
>;

export function MenuSubTrigger(props: MenuSubTriggerProps) {
  return <BaseMenu.SubmenuTrigger data-slot="menu-sub-trigger" {...props} />;
}

export type MenuGroupProps = ComponentProps<typeof BaseMenu.Group>;

export function MenuGroup(props: MenuGroupProps) {
  return <BaseMenu.Group {...props} />;
}

export type MenuLabelProps = ComponentProps<typeof BaseMenu.GroupLabel>;

export function MenuLabel(props: MenuLabelProps) {
  return <BaseMenu.GroupLabel data-slot="menu-label" {...props} />;
}

export type MenuSeparatorProps = ComponentProps<typeof BaseMenu.Separator>;

export function MenuSeparator(props: MenuSeparatorProps) {
  return <BaseMenu.Separator data-slot="menu-separator" {...props} />;
}

export type MenuRowProps = ComponentProps<"div"> & MenuRowVariants;

export function MenuRow({
  density,
  interaction,
  intent,
  className,
  ...props
}: MenuRowProps) {
  return (
    <div
      data-slot="menu-row"
      className={menuRowVariants({ density, interaction, intent, className })}
      {...props}
    />
  );
}

export type MenuSearchRowProps = ComponentProps<"div">;

export function MenuSearchRow(props: MenuSearchRowProps) {
  return <div data-slot="menu-search-row" {...props} />;
}
