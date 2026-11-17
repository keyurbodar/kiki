import { ContextMenu as BaseContextMenu } from "@base-ui/react/context-menu";
import type { ComponentProps } from "react";

export const ContextMenu = BaseContextMenu.Root;

export type ContextMenuProps = ComponentProps<typeof BaseContextMenu.Root>;

export type ContextMenuTriggerProps = ComponentProps<
  typeof BaseContextMenu.Trigger
>;

export function ContextMenuTrigger(props: ContextMenuTriggerProps) {
  return (
    <BaseContextMenu.Trigger data-slot="context-menu-trigger" {...props} />
  );
}

export type ContextMenuContentProps = ComponentProps<
  typeof BaseContextMenu.Popup
> &
  Pick<
    ComponentProps<typeof BaseContextMenu.Positioner>,
    "side" | "align" | "sideOffset" | "alignOffset"
  >;

export function ContextMenuContent({
  side,
  align,
  sideOffset,
  alignOffset,
  ...props
}: ContextMenuContentProps) {
  return (
    <BaseContextMenu.Portal>
      <BaseContextMenu.Positioner
        side={side}
        align={align}
        sideOffset={sideOffset}
        alignOffset={alignOffset}
      >
        <BaseContextMenu.Popup data-slot="context-menu-content" {...props} />
      </BaseContextMenu.Positioner>
    </BaseContextMenu.Portal>
  );
}
