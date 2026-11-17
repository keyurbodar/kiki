import { ContextMenu as BaseContextMenu } from "@base-ui/react/context-menu";
import type { ComponentProps } from "react";
import {
  menuContentHeights,
  menuListClassName,
  menuPopupClassName,
  menuPositionerClassName,
} from "@/primitives/menu";

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

export type ContextMenuContentProps = Omit<
  ComponentProps<typeof BaseContextMenu.Popup>,
  "className"
> &
  Pick<
    ComponentProps<typeof BaseContextMenu.Positioner>,
    "side" | "align" | "sideOffset" | "alignOffset"
  > & {
    className?: string;
    container?:
      | ComponentProps<typeof BaseContextMenu.Portal>["container"]
      | null;
  };

export function ContextMenuContent({
  side,
  align,
  sideOffset,
  alignOffset,
  className,
  container,
  children,
  ...props
}: ContextMenuContentProps) {
  return (
    <BaseContextMenu.Portal container={container ?? undefined}>
      <BaseContextMenu.Positioner
        side={side}
        align={align}
        sideOffset={sideOffset}
        alignOffset={alignOffset}
        className={menuPositionerClassName}
      >
        <BaseContextMenu.Popup
          data-slot="context-menu-content"
          className={[
            menuPopupClassName,
            menuContentHeights.available,
            className,
          ]
            .filter(Boolean)
            .join(" ")}
          {...props}
        >
          <div role="presentation" data-menu-list className={menuListClassName}>
            {children}
          </div>
        </BaseContextMenu.Popup>
      </BaseContextMenu.Positioner>
    </BaseContextMenu.Portal>
  );
}
