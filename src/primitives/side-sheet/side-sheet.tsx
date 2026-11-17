import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { type ComponentProps, createContext, useContext } from "react";
import { buttonVariants } from "@/primitives/button";
import { Drawer, DrawerContent } from "@/primitives/drawer";
import { Icon } from "@/primitives/icon";
import { useIsPhone } from "./use-is-phone";

type ClassName<State> = string | ((state: State) => string | undefined);

const withClass = <State,>(
  base: string,
  className: ClassName<State> | undefined,
) =>
  typeof className === "function"
    ? (state: State) => [base, className(state)].filter(Boolean).join(" ")
    : [base, className].filter(Boolean).join(" ");

const join = (...parts: Array<string | undefined>) =>
  parts.filter(Boolean).join(" ");

const SideSheetContext = createContext({ phone: false });

const sideSheetOverlayClass =
  "fixed inset-0 z-(--z-dialog) bg-overlay transition-opacity duration-fast ease-out data-[starting-style]:opacity-0 data-[ending-style]:opacity-0 data-[ending-style]:duration-exit";

const sideSheetContentClass = [
  "fixed inset-y-0 right-0 z-(--z-dialog) flex w-160 max-w-full flex-col border-l-hairline border-border-1 bg-panel shadow-(--sh-sheet)",
  "h-dvh outline-none",
  "pt-(--safe-top) pb-(--safe-bottom)",
  "transition-[translate,opacity] duration-fast ease-out-quint data-[starting-style]:translate-x-full data-[starting-style]:opacity-0 data-[ending-style]:translate-x-full data-[ending-style]:opacity-0 data-[ending-style]:duration-exit",
].join(" ");

export type SideSheetProps = ComponentProps<typeof BaseDialog.Root>;

export function SideSheet(props: SideSheetProps) {
  const phone = useIsPhone();
  return (
    <SideSheetContext.Provider value={{ phone }}>
      {phone ? (
        <Drawer {...(props as ComponentProps<typeof Drawer>)} />
      ) : (
        <BaseDialog.Root {...props} />
      )}
    </SideSheetContext.Provider>
  );
}

export type SideSheetTriggerProps = ComponentProps<typeof BaseDialog.Trigger>;

export function SideSheetTrigger(props: SideSheetTriggerProps) {
  return <BaseDialog.Trigger data-slot="side-sheet-trigger" {...props} />;
}

export type SideSheetOverlayProps = ComponentProps<typeof BaseDialog.Backdrop>;

export function SideSheetOverlay({
  className,
  ...props
}: SideSheetOverlayProps) {
  return (
    <BaseDialog.Backdrop
      data-slot="side-sheet-overlay"
      className={withClass(sideSheetOverlayClass, className)}
      {...props}
    />
  );
}

export type SideSheetContentProps = ComponentProps<typeof BaseDialog.Popup>;

export function SideSheetContent({
  className,
  children,
  ...props
}: SideSheetContentProps) {
  const { phone } = useContext(SideSheetContext);
  if (phone) {
    const drawerClassName =
      typeof className === "function"
        ? (className as unknown as (state: object) => string | undefined)({})
        : className;
    return (
      <DrawerContent
        {...({ className: drawerClassName, ...props } as ComponentProps<
          typeof DrawerContent
        >)}
      >
        {children}
      </DrawerContent>
    );
  }
  return (
    <BaseDialog.Portal>
      <SideSheetOverlay />
      <BaseDialog.Popup
        data-slot="side-sheet-content"
        className={withClass(sideSheetContentClass, className)}
        {...props}
      >
        {children}
      </BaseDialog.Popup>
    </BaseDialog.Portal>
  );
}

export type SideSheetHeaderProps = ComponentProps<"div">;

export function SideSheetHeader({
  className,
  children,
  ...props
}: SideSheetHeaderProps) {
  const { phone } = useContext(SideSheetContext);
  return (
    <div
      data-slot="side-sheet-header"
      className={join(
        "grid shrink-0 grid-cols-[minmax(0,1fr)_auto] gap-x-3 px-5 pt-4",
        className,
      )}
      {...props}
    >
      {children}
      {!phone && (
        <BaseDialog.Close
          data-slot="side-sheet-close"
          className={join(
            buttonVariants({ variant: "ghost", size: "icon-sm" }),
            "col-start-2 row-start-1 -mt-0.5 -mr-1.5 cursor-pointer self-start justify-self-end text-icon-muted",
          )}
        >
          <Icon name="x" />
          <span className="sr-only">Close</span>
        </BaseDialog.Close>
      )}
    </div>
  );
}

export type SideSheetTitleProps = ComponentProps<typeof BaseDialog.Title>;

export function SideSheetTitle({ className, ...props }: SideSheetTitleProps) {
  return (
    <BaseDialog.Title
      data-slot="side-sheet-title"
      className={withClass(
        "col-start-1 row-start-1 self-center text-balance text-base font-medium text-foreground",
        className,
      )}
      {...props}
    />
  );
}

export type SideSheetDescriptionProps = ComponentProps<
  typeof BaseDialog.Description
>;

export function SideSheetDescription({
  className,
  ...props
}: SideSheetDescriptionProps) {
  return (
    <BaseDialog.Description
      data-slot="side-sheet-description"
      className={withClass(
        "col-span-full row-start-2 mt-1 text-pretty text-sm text-muted-foreground-2",
        className,
      )}
      {...props}
    />
  );
}

export type SideSheetBodyProps = ComponentProps<"div">;

export function SideSheetBody({ className, ...props }: SideSheetBodyProps) {
  return (
    <div
      data-slot="side-sheet-body"
      className={join(
        "flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain px-5 py-4",
        className,
      )}
      {...props}
    />
  );
}

export type SideSheetFooterProps = ComponentProps<"div">;

export function SideSheetFooter({ className, ...props }: SideSheetFooterProps) {
  const { phone } = useContext(SideSheetContext);
  return (
    <div
      data-slot="side-sheet-footer"
      className={join(
        "flex shrink-0 flex-row justify-end gap-2 px-5 py-4",
        phone ? undefined : "border-t-hairline border-border-1",
        className,
      )}
      {...props}
    />
  );
}

export type SideSheetCloseProps = ComponentProps<typeof BaseDialog.Close>;

export function SideSheetClose(props: SideSheetCloseProps) {
  return <BaseDialog.Close data-slot="side-sheet-close" {...props} />;
}
