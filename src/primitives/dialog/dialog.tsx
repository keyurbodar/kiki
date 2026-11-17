import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { cva, cx } from "class-variance-authority";
import { type ComponentProps, isValidElement } from "react";
import { buttonVariants } from "@/primitives/button";

const PASSWORD_MANAGER_TAG_PREFIXES = [
  "com-1password-",
  "bitwarden-",
  "lpform-",
  "dashlanefr-",
  "protonpass-",
];

const PASSWORD_MANAGER_TAGS = [
  "keepassxc-username-field",
  "keepassxc-password-field",
];

const PASSWORD_MANAGER_SELECTOR =
  "[data-com-onepassword-filled], [data-1p-ignore], [data-lastpass-icon-root], [data-dashlane-rid], [data-protonpass-form], [data-keepassxc-id]";

/** True for elements that password-manager extensions inject into the page. */
export function isPasswordManagerElement(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  const tag = target.tagName.toLowerCase();
  if (
    PASSWORD_MANAGER_TAG_PREFIXES.some((prefix) => tag.startsWith(prefix)) ||
    PASSWORD_MANAGER_TAGS.includes(tag)
  ) {
    return true;
  }
  return target.closest(PASSWORD_MANAGER_SELECTOR) !== null;
}

type StateClassName<State> =
  | string
  | ((state: State) => string | undefined)
  | undefined;

function withBaseClassName<State>(
  base: string,
  className: StateClassName<State>,
) {
  return typeof className === "function"
    ? (state: State) => cx(base, className(state))
    : cx(base, className);
}

function asChildRender(
  asChild: boolean | undefined,
  render: unknown,
  children: unknown,
) {
  if (render !== undefined) return render;
  return asChild && isValidElement(children) ? children : undefined;
}

export type DialogProps = ComponentProps<typeof BaseDialog.Root>;

export function Dialog({ onOpenChange, ...props }: DialogProps) {
  return (
    <BaseDialog.Root
      onOpenChange={(open, details) => {
        if (
          !open &&
          details.reason === "outside-press" &&
          isPasswordManagerElement(details.event.target)
        ) {
          details.cancel();
          return;
        }
        onOpenChange?.(open, details);
      }}
      {...props}
    />
  );
}

export type DialogTriggerProps = ComponentProps<typeof BaseDialog.Trigger> & {
  asChild?: boolean;
};

export function DialogTrigger({
  asChild,
  render,
  children,
  ...props
}: DialogTriggerProps) {
  const element = asChildRender(asChild, render, children) as
    | DialogTriggerProps["render"]
    | undefined;
  return (
    <BaseDialog.Trigger data-slot="dialog-trigger" render={element} {...props}>
      {element ? null : children}
    </BaseDialog.Trigger>
  );
}

export const dialogOverlayVariants = cva(
  "fixed inset-0 z-(--z-dialog) transition-opacity duration-base ease-out data-[starting-style]:opacity-0 data-[ending-style]:opacity-0 data-[ending-style]:duration-fast",
  {
    variants: {
      scrim: { dim: "bg-overlay", media: "bg-overlay-media" },
    },
    defaultVariants: { scrim: "dim" },
  },
);

export type DialogOverlayProps = ComponentProps<typeof BaseDialog.Backdrop> & {
  scrim?: "dim" | "media";
};

export function DialogOverlay({
  className,
  scrim,
  ...props
}: DialogOverlayProps) {
  return (
    <BaseDialog.Backdrop
      data-slot="dialog-overlay"
      className={withBaseClassName(dialogOverlayVariants({ scrim }), className)}
      {...props}
    />
  );
}

export const dialogContentClassName =
  "relative flex w-full max-w-lg flex-col overflow-y-auto rounded-(--radius-panel) border-hairline border-border-2 bg-popover text-left shadow-overlay [--table-lead-bg:var(--popover)] outline-none transition-[opacity,scale] duration-base ease-out-quint data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[ending-style]:duration-fast";

export type DialogContentProps = ComponentProps<typeof BaseDialog.Popup> & {
  nestedBackdrop?: boolean;
};

export function DialogContent({
  className,
  nestedBackdrop,
  ...props
}: DialogContentProps) {
  return (
    <BaseDialog.Portal>
      <BaseDialog.Backdrop
        data-slot="dialog-overlay"
        forceRender={nestedBackdrop}
        className={dialogOverlayVariants()}
      />
      <div className="fixed inset-0 z-(--z-dialog) flex h-dvh items-center justify-center px-4 pt-[calc(1rem+var(--safe-top))] pb-[calc(1rem+var(--safe-bottom))]">
        <BaseDialog.Popup
          data-slot="dialog-content"
          className={withBaseClassName(
            cx(dialogContentClassName, "max-h-full"),
            className,
          )}
          {...props}
        />
      </div>
    </BaseDialog.Portal>
  );
}

function CrossLargeIcon() {
  return (
    <svg
      aria-hidden
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M5 5L19 19M19 5L5 19"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export type DialogHeaderProps = ComponentProps<"div">;

export function DialogHeader({
  className,
  children,
  ...props
}: DialogHeaderProps) {
  return (
    <div
      data-slot="dialog-header"
      className={cx(
        "grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 px-5 pt-4",
        className,
      )}
      {...props}
    >
      {children}
      <BaseDialog.Close
        data-slot="dialog-close"
        className={cx(
          buttonVariants({ variant: "ghost", size: "icon-sm" }),
          "col-start-2 row-start-1 -mt-0.5 -mr-1.5 cursor-pointer self-start justify-self-end text-icon-muted",
        )}
      >
        <CrossLargeIcon />
        <span className="sr-only">Close</span>
      </BaseDialog.Close>
    </div>
  );
}

export type DialogTitleProps = ComponentProps<typeof BaseDialog.Title> & {
  size?: "base" | "lg";
};

export function DialogTitle({
  className,
  size = "base",
  ...props
}: DialogTitleProps) {
  return (
    <BaseDialog.Title
      data-slot="dialog-title"
      className={withBaseClassName(
        cx(
          "col-start-1 row-start-1 self-center text-balance font-medium text-foreground",
          size === "lg" ? "text-xl" : "text-base",
        ),
        className,
      )}
      {...props}
    />
  );
}

export type DialogDescriptionProps = ComponentProps<
  typeof BaseDialog.Description
>;

export function DialogDescription({
  className,
  ...props
}: DialogDescriptionProps) {
  return (
    <BaseDialog.Description
      data-slot="dialog-description"
      className={withBaseClassName(
        "col-span-full row-start-2 mt-1 text-pretty text-sm text-muted-foreground-2 *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground",
        className,
      )}
      {...props}
    />
  );
}

export type DialogBodyProps = ComponentProps<"div"> & {
  spacing?: "base" | "relaxed";
};

export function DialogBody({
  className,
  spacing = "base",
  ...props
}: DialogBodyProps) {
  return (
    <div
      data-slot="dialog-body"
      className={cx(
        "flex flex-col px-5",
        spacing === "relaxed" ? "gap-4 py-5" : "gap-3 py-4",
        className,
      )}
      {...props}
    />
  );
}

export type DialogFooterProps = ComponentProps<"div">;

export function DialogFooter({ className, ...props }: DialogFooterProps) {
  return (
    <div
      data-slot="dialog-footer"
      className={cx("flex flex-row justify-end gap-2 px-5 pb-4", className)}
      {...props}
    />
  );
}

export type DialogCloseProps = ComponentProps<typeof BaseDialog.Close> & {
  asChild?: boolean;
};

export function DialogClose({
  asChild,
  render,
  children,
  ...props
}: DialogCloseProps) {
  const element = asChildRender(asChild, render, children) as
    | DialogCloseProps["render"]
    | undefined;
  return (
    <BaseDialog.Close data-slot="dialog-close" render={element} {...props}>
      {element ? null : children}
    </BaseDialog.Close>
  );
}
