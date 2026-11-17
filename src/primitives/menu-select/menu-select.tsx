import { Select as BaseSelect } from "@base-ui/react/select";
import { cx } from "class-variance-authority";
import type { ComponentProps, ReactNode } from "react";
import { type ButtonVariants, buttonVariants } from "@/primitives/button";
import { type MenuRowVariants, menuRowVariants } from "@/primitives/menu";
import {
  CheckmarkIcon,
  ChevronDownSmallIcon,
  menuCheckIconClass,
  menuChevronIconClass,
  menuGroupLabelClass,
  menuItemIconClass,
  menuListClass,
  menuPopupClass,
  menuPositionerClass,
  withClassName,
} from "./menu-parts";

export const MenuSelect = BaseSelect.Root;

export type MenuSelectProps = ComponentProps<typeof BaseSelect.Root>;

export type MenuSelectTriggerProps = ComponentProps<typeof BaseSelect.Trigger> &
  Pick<ButtonVariants, "variant" | "size">;

export function MenuSelectTrigger({
  className,
  variant,
  size,
  children,
  ...props
}: MenuSelectTriggerProps) {
  return (
    <BaseSelect.Trigger
      data-slot="menu-select-trigger"
      className={withClassName(
        cx(
          buttonVariants({ variant, size }),
          "justify-between! data-[placeholder]:text-muted-foreground-3",
        ),
        className,
      )}
      {...props}
    >
      {children}
      <BaseSelect.Icon>
        <ChevronDownSmallIcon className={menuChevronIconClass} />
      </BaseSelect.Icon>
    </BaseSelect.Trigger>
  );
}

export type MenuSelectValueProps = ComponentProps<typeof BaseSelect.Value>;

export function MenuSelectValue(props: MenuSelectValueProps) {
  return <BaseSelect.Value data-slot="menu-select-value" {...props} />;
}

export type MenuSelectContentProps = Omit<
  ComponentProps<typeof BaseSelect.Popup>,
  "children"
> &
  Pick<
    ComponentProps<typeof BaseSelect.Positioner>,
    | "side"
    | "align"
    | "sideOffset"
    | "alignOffset"
    | "collisionPadding"
    | "anchor"
  > & {
    container?: ComponentProps<typeof BaseSelect.Portal>["container"];
    children?: ComponentProps<typeof BaseSelect.List>["children"];
  };

export function MenuSelectContent({
  className,
  side,
  align = "start",
  sideOffset = 4,
  alignOffset,
  collisionPadding = 12,
  anchor,
  container,
  children,
  ...props
}: MenuSelectContentProps) {
  return (
    <BaseSelect.Portal container={container ?? undefined}>
      <BaseSelect.Positioner
        align={align}
        side={side}
        sideOffset={sideOffset}
        alignOffset={alignOffset}
        collisionPadding={collisionPadding}
        anchor={anchor}
        alignItemWithTrigger={false}
        className={menuPositionerClass}
      >
        <BaseSelect.Popup
          data-slot="menu-select-content"
          className={withClassName(
            cx(menuPopupClass, "min-w-(--anchor-width)"),
            className,
          )}
          {...props}
        >
          <BaseSelect.List data-menu-list className={menuListClass}>
            {children}
          </BaseSelect.List>
        </BaseSelect.Popup>
      </BaseSelect.Positioner>
    </BaseSelect.Portal>
  );
}

export type MenuSelectGroupProps = ComponentProps<typeof BaseSelect.Group>;

export function MenuSelectGroup(props: MenuSelectGroupProps) {
  return <BaseSelect.Group data-slot="menu-select-group" {...props} />;
}

export type MenuSelectLabelProps = ComponentProps<typeof BaseSelect.GroupLabel>;

export function MenuSelectLabel({ className, ...props }: MenuSelectLabelProps) {
  return (
    <BaseSelect.GroupLabel
      data-slot="menu-select-label"
      className={withClassName(menuGroupLabelClass, className)}
      {...props}
    />
  );
}

export type MenuSelectItemProps = ComponentProps<typeof BaseSelect.Item> &
  Pick<MenuRowVariants, "density"> & {
    icon?: ReactNode;
    trailing?: ReactNode;
  };

export function MenuSelectItem({
  className,
  children,
  density,
  icon,
  trailing,
  ...props
}: MenuSelectItemProps) {
  return (
    <BaseSelect.Item
      data-slot="menu-select-item"
      className={withClassName(menuRowVariants({ density }), className)}
      {...props}
    >
      {icon && <span className={menuItemIconClass}>{icon}</span>}
      <BaseSelect.ItemText className="min-w-0 flex-1">
        {children}
      </BaseSelect.ItemText>
      <BaseSelect.ItemIndicator className="ml-auto">
        <CheckmarkIcon className={menuCheckIconClass} />
      </BaseSelect.ItemIndicator>
      {trailing}
    </BaseSelect.Item>
  );
}
