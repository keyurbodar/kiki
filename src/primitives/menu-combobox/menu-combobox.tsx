import { Combobox as BaseCombobox } from "@base-ui/react/combobox";
import type { ComponentProps } from "react";

export const MenuCombobox = BaseCombobox.Root;

export type MenuComboboxProps = ComponentProps<typeof BaseCombobox.Root>;

export type MenuComboboxTriggerProps = ComponentProps<
  typeof BaseCombobox.Trigger
>;

export function MenuComboboxTrigger(props: MenuComboboxTriggerProps) {
  return <BaseCombobox.Trigger data-slot="menu-combobox-trigger" {...props} />;
}

export type MenuComboboxInputProps = ComponentProps<typeof BaseCombobox.Input>;

export function MenuComboboxInput(props: MenuComboboxInputProps) {
  return <BaseCombobox.Input {...props} />;
}

export type MenuComboboxContentProps = ComponentProps<
  typeof BaseCombobox.Popup
> &
  Pick<
    ComponentProps<typeof BaseCombobox.Positioner>,
    "side" | "align" | "sideOffset" | "alignOffset"
  >;

export function MenuComboboxContent({
  side,
  align,
  sideOffset,
  alignOffset,
  ...props
}: MenuComboboxContentProps) {
  return (
    <BaseCombobox.Portal>
      <BaseCombobox.Positioner
        side={side}
        align={align}
        sideOffset={sideOffset}
        alignOffset={alignOffset}
      >
        <BaseCombobox.Popup data-slot="menu-combobox-content" {...props} />
      </BaseCombobox.Positioner>
    </BaseCombobox.Portal>
  );
}

export type MenuComboboxListProps = ComponentProps<typeof BaseCombobox.List>;

export function MenuComboboxList(props: MenuComboboxListProps) {
  return <BaseCombobox.List {...props} />;
}

export type MenuComboboxGroupProps = ComponentProps<typeof BaseCombobox.Group>;

export function MenuComboboxGroup(props: MenuComboboxGroupProps) {
  return <BaseCombobox.Group data-slot="menu-combobox-group" {...props} />;
}

export type MenuComboboxGroupLabelProps = ComponentProps<
  typeof BaseCombobox.GroupLabel
>;

export function MenuComboboxGroupLabel(props: MenuComboboxGroupLabelProps) {
  return (
    <BaseCombobox.GroupLabel data-slot="menu-combobox-group-label" {...props} />
  );
}

export type MenuComboboxItemProps = ComponentProps<typeof BaseCombobox.Item>;

export function MenuComboboxItem(props: MenuComboboxItemProps) {
  return <BaseCombobox.Item data-slot="menu-combobox-item" {...props} />;
}

export type MenuComboboxFooterProps = ComponentProps<"div">;

export function MenuComboboxFooter(props: MenuComboboxFooterProps) {
  return <div data-slot="menu-combobox-footer" {...props} />;
}
