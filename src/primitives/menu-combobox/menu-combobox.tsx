import { Combobox as BaseCombobox } from "@base-ui/react/combobox";
import { cx } from "class-variance-authority";
import type { ComponentProps, ReactNode } from "react";
import { type ButtonVariants, buttonVariants } from "@/primitives/button";
import {
  type MenuRowVariants,
  MenuSearchRow,
  menuRowVariants,
} from "@/primitives/menu";
import {
  CheckmarkIcon,
  menuCheckIconClass,
  menuGroupLabelClass,
  menuPopupClass,
  menuPositionerClass,
  menuSearchInputClass,
  menuSeparatorClass,
  withClassName,
} from "@/primitives/menu-select/menu-parts";

export const MenuCombobox = BaseCombobox.Root;

export type MenuComboboxProps = ComponentProps<typeof BaseCombobox.Root>;

export type MenuComboboxTriggerProps = ComponentProps<
  typeof BaseCombobox.Trigger
> &
  Pick<ButtonVariants, "variant" | "size">;

export function MenuComboboxTrigger({
  className,
  variant,
  size,
  ...props
}: MenuComboboxTriggerProps) {
  return (
    <BaseCombobox.Trigger
      data-slot="menu-combobox-trigger"
      className={withClassName(
        variant === undefined && size === undefined
          ? ""
          : buttonVariants({ variant, size }),
        className,
      )}
      {...props}
    />
  );
}

export type MenuComboboxInputProps = ComponentProps<typeof BaseCombobox.Input>;

export function MenuComboboxInput({
  className,
  ...props
}: MenuComboboxInputProps) {
  return (
    <BaseCombobox.Input
      className={withClassName(menuSearchInputClass, className)}
      {...props}
    />
  );
}

export type MenuComboboxContentProps = Omit<
  ComponentProps<typeof BaseCombobox.Popup>,
  "children"
> &
  Pick<
    ComponentProps<typeof BaseCombobox.Positioner>,
    | "side"
    | "align"
    | "sideOffset"
    | "alignOffset"
    | "collisionPadding"
    | "anchor"
  > & {
    container?: ComponentProps<typeof BaseCombobox.Portal>["container"];
    searchPlaceholder?: string;
    emptyText?: ReactNode;
    footer?: ReactNode;
    children?: MenuComboboxListProps["children"];
  };

export function MenuComboboxContent({
  className,
  side,
  align = "start",
  sideOffset = 4,
  alignOffset,
  collisionPadding = 12,
  anchor,
  container,
  searchPlaceholder = "Search...",
  emptyText = "No results found",
  footer,
  children,
  ...props
}: MenuComboboxContentProps) {
  return (
    <BaseCombobox.Portal container={container ?? undefined}>
      <BaseCombobox.Positioner
        align={align}
        side={side}
        sideOffset={sideOffset}
        alignOffset={alignOffset}
        collisionPadding={collisionPadding}
        anchor={anchor}
        className={menuPositionerClass}
      >
        <BaseCombobox.Popup
          data-slot="menu-combobox-content"
          className={withClassName(cx(menuPopupClass, "min-w-32"), className)}
          {...props}
        >
          <MenuSearchRow>
            <MenuComboboxInput placeholder={searchPlaceholder} />
          </MenuSearchRow>
          <BaseCombobox.Empty className="px-2 py-6 text-center text-sm text-muted-foreground-2 empty:hidden">
            {emptyText}
          </BaseCombobox.Empty>
          <MenuComboboxList>{children}</MenuComboboxList>
          {footer ? <MenuComboboxFooter>{footer}</MenuComboboxFooter> : null}
        </BaseCombobox.Popup>
      </BaseCombobox.Positioner>
    </BaseCombobox.Portal>
  );
}

export type MenuComboboxListProps = ComponentProps<typeof BaseCombobox.List>;

export function MenuComboboxList({
  className,
  ...props
}: MenuComboboxListProps) {
  return (
    <BaseCombobox.List
      className={withClassName(
        "min-h-0 flex-1 overflow-y-auto md:scroll-fade-y",
        className,
      )}
      {...props}
    />
  );
}

export type MenuComboboxGroupProps = ComponentProps<typeof BaseCombobox.Group>;

export function MenuComboboxGroup({
  className,
  ...props
}: MenuComboboxGroupProps) {
  return (
    <BaseCombobox.Group
      data-slot="menu-combobox-group"
      className={withClassName("flex flex-col [&+&]:mt-1", className)}
      {...props}
    />
  );
}

export type MenuComboboxGroupLabelProps = ComponentProps<
  typeof BaseCombobox.GroupLabel
>;

export function MenuComboboxGroupLabel({
  className,
  ...props
}: MenuComboboxGroupLabelProps) {
  return (
    <BaseCombobox.GroupLabel
      data-slot="menu-combobox-group-label"
      className={withClassName(menuGroupLabelClass, className)}
      {...props}
    />
  );
}

export type MenuComboboxItemProps = ComponentProps<typeof BaseCombobox.Item> &
  Pick<MenuRowVariants, "density">;

export function MenuComboboxItem({
  className,
  children,
  density,
  ...props
}: MenuComboboxItemProps) {
  return (
    <BaseCombobox.Item
      data-slot="menu-combobox-item"
      className={withClassName(menuRowVariants({ density }), className)}
      {...props}
    >
      {children}
      <BaseCombobox.ItemIndicator className="ml-auto">
        <CheckmarkIcon className={menuCheckIconClass} />
      </BaseCombobox.ItemIndicator>
    </BaseCombobox.Item>
  );
}

export type MenuComboboxFooterProps = ComponentProps<"div">;

export function MenuComboboxFooter({
  className,
  children,
  ...props
}: MenuComboboxFooterProps) {
  return (
    <div
      data-slot="menu-combobox-footer"
      className={cx("shrink-0", className)}
      {...props}
    >
      <div className={menuSeparatorClass} />
      {children}
    </div>
  );
}
