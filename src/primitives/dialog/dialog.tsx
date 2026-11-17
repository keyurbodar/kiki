import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import type { ComponentProps } from "react";

export const Dialog = BaseDialog.Root;

export type DialogProps = ComponentProps<typeof BaseDialog.Root>;

export type DialogTriggerProps = ComponentProps<typeof BaseDialog.Trigger>;

export function DialogTrigger(props: DialogTriggerProps) {
  return <BaseDialog.Trigger data-slot="dialog-trigger" {...props} />;
}

export type DialogOverlayProps = ComponentProps<typeof BaseDialog.Backdrop>;

export function DialogOverlay(props: DialogOverlayProps) {
  return <BaseDialog.Backdrop data-slot="dialog-overlay" {...props} />;
}

export type DialogContentProps = ComponentProps<typeof BaseDialog.Popup>;

export function DialogContent(props: DialogContentProps) {
  return (
    <BaseDialog.Portal>
      <BaseDialog.Popup data-slot="dialog-content" {...props} />
    </BaseDialog.Portal>
  );
}

export type DialogHeaderProps = ComponentProps<"div">;

export function DialogHeader(props: DialogHeaderProps) {
  return <div data-slot="dialog-header" {...props} />;
}

export type DialogTitleProps = ComponentProps<typeof BaseDialog.Title>;

export function DialogTitle(props: DialogTitleProps) {
  return <BaseDialog.Title data-slot="dialog-title" {...props} />;
}

export type DialogDescriptionProps = ComponentProps<
  typeof BaseDialog.Description
>;

export function DialogDescription(props: DialogDescriptionProps) {
  return <BaseDialog.Description data-slot="dialog-description" {...props} />;
}

export type DialogBodyProps = ComponentProps<"div">;

export function DialogBody(props: DialogBodyProps) {
  return <div data-slot="dialog-body" {...props} />;
}

export type DialogFooterProps = ComponentProps<"div">;

export function DialogFooter(props: DialogFooterProps) {
  return <div data-slot="dialog-footer" {...props} />;
}

export type DialogCloseProps = ComponentProps<typeof BaseDialog.Close>;

export function DialogClose(props: DialogCloseProps) {
  return <BaseDialog.Close data-slot="dialog-close" {...props} />;
}
