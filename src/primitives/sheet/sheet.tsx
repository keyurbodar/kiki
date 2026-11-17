import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import type { ComponentProps } from "react";

export const Sheet = BaseDialog.Root;

export type SheetProps = ComponentProps<typeof BaseDialog.Root>;

export type SheetTriggerProps = ComponentProps<typeof BaseDialog.Trigger>;

export function SheetTrigger(props: SheetTriggerProps) {
  return <BaseDialog.Trigger data-slot="sheet-trigger" {...props} />;
}

export type SheetOverlayProps = ComponentProps<typeof BaseDialog.Backdrop>;

export function SheetOverlay(props: SheetOverlayProps) {
  return <BaseDialog.Backdrop data-slot="sheet-overlay" {...props} />;
}

export type SheetContentProps = ComponentProps<typeof BaseDialog.Popup>;

export function SheetContent(props: SheetContentProps) {
  return (
    <BaseDialog.Portal>
      <BaseDialog.Popup data-slot="sheet-content" {...props} />
    </BaseDialog.Portal>
  );
}

export type SheetTitleProps = ComponentProps<typeof BaseDialog.Title>;

export function SheetTitle(props: SheetTitleProps) {
  return <BaseDialog.Title {...props} />;
}

export type SheetDescriptionProps = ComponentProps<
  typeof BaseDialog.Description
>;

export function SheetDescription(props: SheetDescriptionProps) {
  return <BaseDialog.Description {...props} />;
}

export type SheetCloseProps = ComponentProps<typeof BaseDialog.Close>;

export function SheetClose(props: SheetCloseProps) {
  return <BaseDialog.Close {...props} />;
}
