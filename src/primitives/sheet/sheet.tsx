import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import type { ComponentProps } from "react";
import "./sheet.css";

type ClassName<State> = string | ((state: State) => string | undefined);

const withClass = <State,>(
  base: string,
  className: ClassName<State> | undefined,
) =>
  typeof className === "function"
    ? (state: State) => [base, className(state)].filter(Boolean).join(" ")
    : [base, className].filter(Boolean).join(" ");

const sheetOverlayClass =
  "fixed inset-0 z-(--z-drawer) bg-overlay transition-opacity duration-fast ease-out data-[starting-style]:opacity-0 data-[ending-style]:opacity-0 data-[ending-style]:duration-exit";

const sheetContentClass = [
  "fixed inset-y-0 left-0 z-(--z-drawer) flex w-[min(88vw,--spacing(100))] flex-col border-r-hairline border-border-1 bg-panel shadow-(--sh-sheet)",
  "h-dvh overflow-y-auto overscroll-contain outline-none",
  "pt-(--safe-top) pb-(--safe-bottom)",
  "transition-[translate,opacity] duration-fast ease-out-quint data-[starting-style]:-translate-x-full data-[starting-style]:opacity-0 data-[ending-style]:-translate-x-full data-[ending-style]:opacity-0 data-[ending-style]:duration-exit",
].join(" ");

export const Sheet = BaseDialog.Root;

export type SheetProps = ComponentProps<typeof BaseDialog.Root>;

export type SheetTriggerProps = ComponentProps<typeof BaseDialog.Trigger>;

export function SheetTrigger(props: SheetTriggerProps) {
  return <BaseDialog.Trigger data-slot="sheet-trigger" {...props} />;
}

export type SheetOverlayProps = ComponentProps<typeof BaseDialog.Backdrop>;

export function SheetOverlay({ className, ...props }: SheetOverlayProps) {
  return (
    <BaseDialog.Backdrop
      data-slot="sheet-overlay"
      className={withClass(sheetOverlayClass, className)}
      {...props}
    />
  );
}

export type SheetContentProps = ComponentProps<typeof BaseDialog.Popup>;

export function SheetContent({ className, ...props }: SheetContentProps) {
  return (
    <BaseDialog.Portal keepMounted>
      <SheetOverlay />
      <BaseDialog.Popup
        data-slot="sheet-content"
        className={withClass(sheetContentClass, className)}
        {...props}
      />
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
