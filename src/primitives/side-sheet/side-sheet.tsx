import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import type { ComponentProps } from "react";

export const SideSheet = BaseDialog.Root;

export type SideSheetProps = ComponentProps<typeof BaseDialog.Root>;

export type SideSheetTriggerProps = ComponentProps<typeof BaseDialog.Trigger>;

export function SideSheetTrigger(props: SideSheetTriggerProps) {
  return <BaseDialog.Trigger data-slot="side-sheet-trigger" {...props} />;
}

export type SideSheetOverlayProps = ComponentProps<typeof BaseDialog.Backdrop>;

export function SideSheetOverlay(props: SideSheetOverlayProps) {
  return <BaseDialog.Backdrop data-slot="side-sheet-overlay" {...props} />;
}

export type SideSheetContentProps = ComponentProps<typeof BaseDialog.Popup>;

export function SideSheetContent(props: SideSheetContentProps) {
  return (
    <BaseDialog.Portal>
      <BaseDialog.Popup data-slot="side-sheet-content" {...props} />
    </BaseDialog.Portal>
  );
}

export type SideSheetHeaderProps = ComponentProps<"div">;

export function SideSheetHeader(props: SideSheetHeaderProps) {
  return <div data-slot="side-sheet-header" {...props} />;
}

export type SideSheetTitleProps = ComponentProps<typeof BaseDialog.Title>;

export function SideSheetTitle(props: SideSheetTitleProps) {
  return <BaseDialog.Title data-slot="side-sheet-title" {...props} />;
}

export type SideSheetDescriptionProps = ComponentProps<
  typeof BaseDialog.Description
>;

export function SideSheetDescription(props: SideSheetDescriptionProps) {
  return (
    <BaseDialog.Description data-slot="side-sheet-description" {...props} />
  );
}

export type SideSheetBodyProps = ComponentProps<"div">;

export function SideSheetBody(props: SideSheetBodyProps) {
  return <div data-slot="side-sheet-body" {...props} />;
}

export type SideSheetFooterProps = ComponentProps<"div">;

export function SideSheetFooter(props: SideSheetFooterProps) {
  return <div data-slot="side-sheet-footer" {...props} />;
}

export type SideSheetCloseProps = ComponentProps<typeof BaseDialog.Close>;

export function SideSheetClose(props: SideSheetCloseProps) {
  return <BaseDialog.Close data-slot="side-sheet-close" {...props} />;
}
