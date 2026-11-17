import { Drawer as BaseDrawer } from "@base-ui/react/drawer";
import type { ComponentProps } from "react";

export const Drawer = BaseDrawer.Root;

export type DrawerProps = ComponentProps<typeof BaseDrawer.Root>;

export type DrawerTriggerProps = ComponentProps<typeof BaseDrawer.Trigger>;

export function DrawerTrigger(props: DrawerTriggerProps) {
  return <BaseDrawer.Trigger data-slot="drawer-trigger" {...props} />;
}

export type DrawerOverlayProps = ComponentProps<typeof BaseDrawer.Backdrop>;

export function DrawerOverlay(props: DrawerOverlayProps) {
  return <BaseDrawer.Backdrop data-slot="drawer-overlay" {...props} />;
}

export type DrawerContentProps = ComponentProps<typeof BaseDrawer.Popup>;

export function DrawerContent(props: DrawerContentProps) {
  return (
    <BaseDrawer.Portal>
      <BaseDrawer.Popup data-slot="drawer-content" {...props} />
    </BaseDrawer.Portal>
  );
}

export type DrawerHandleProps = ComponentProps<"div">;

export function DrawerHandle(props: DrawerHandleProps) {
  return <div data-slot="drawer-handle" {...props} />;
}

export type DrawerTitleProps = ComponentProps<typeof BaseDrawer.Title>;

export function DrawerTitle(props: DrawerTitleProps) {
  return <BaseDrawer.Title {...props} />;
}

export type DrawerDescriptionProps = ComponentProps<
  typeof BaseDrawer.Description
>;

export function DrawerDescription(props: DrawerDescriptionProps) {
  return <BaseDrawer.Description {...props} />;
}

export type DrawerCloseProps = ComponentProps<typeof BaseDrawer.Close>;

export function DrawerClose(props: DrawerCloseProps) {
  return <BaseDrawer.Close {...props} />;
}
