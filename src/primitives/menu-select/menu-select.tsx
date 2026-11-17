import { Select as BaseSelect } from "@base-ui/react/select";
import type { ComponentProps } from "react";

export const MenuSelect = BaseSelect.Root;

export type MenuSelectProps = ComponentProps<typeof BaseSelect.Root>;

export type MenuSelectTriggerProps = ComponentProps<typeof BaseSelect.Trigger>;

export function MenuSelectTrigger(props: MenuSelectTriggerProps) {
  return <BaseSelect.Trigger data-slot="menu-select-trigger" {...props} />;
}

export type MenuSelectValueProps = ComponentProps<typeof BaseSelect.Value>;

export function MenuSelectValue(props: MenuSelectValueProps) {
  return <BaseSelect.Value data-slot="menu-select-value" {...props} />;
}

export type MenuSelectContentProps = ComponentProps<typeof BaseSelect.Popup> &
  Pick<
    ComponentProps<typeof BaseSelect.Positioner>,
    "side" | "align" | "sideOffset" | "alignOffset"
  >;

export function MenuSelectContent({
  side,
  align,
  sideOffset,
  alignOffset,
  ...props
}: MenuSelectContentProps) {
  return (
    <BaseSelect.Portal>
      <BaseSelect.Positioner
        side={side}
        align={align}
        sideOffset={sideOffset}
        alignOffset={alignOffset}
      >
        <BaseSelect.Popup data-slot="menu-select-content" {...props} />
      </BaseSelect.Positioner>
    </BaseSelect.Portal>
  );
}

export type MenuSelectGroupProps = ComponentProps<typeof BaseSelect.Group>;

export function MenuSelectGroup(props: MenuSelectGroupProps) {
  return <BaseSelect.Group data-slot="menu-select-group" {...props} />;
}

export type MenuSelectLabelProps = ComponentProps<typeof BaseSelect.GroupLabel>;

export function MenuSelectLabel(props: MenuSelectLabelProps) {
  return <BaseSelect.GroupLabel data-slot="menu-select-label" {...props} />;
}

export type MenuSelectItemProps = ComponentProps<typeof BaseSelect.Item>;

export function MenuSelectItem(props: MenuSelectItemProps) {
  return <BaseSelect.Item data-slot="menu-select-item" {...props} />;
}
