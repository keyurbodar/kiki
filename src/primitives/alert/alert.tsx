import { cva, cx, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import type { Intent } from "@/primitives/intent";

const alertColors: Record<Intent, string> = {
  neutral: "",
  accent: "[&>svg]:[--intent-text:var(--primary-ink)]",
  danger: "[&>svg]:[--intent-text:var(--destructive)]",
  warning: "[&>svg]:[--intent-text:var(--warning-fg)]",
  success: "",
  info: "",
  purple: "",
  pink: "",
  orange: "",
  lime: "",
};

export const alertVariants = cva(
  [
    "relative w-full rounded-(--radius-card) border-hairline border-border-1 bg-card p-4 text-sm shadow-card",
    "[&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:size-(--icon-base) [&>svg~*:not([data-slot=alert-action])]:pl-6.5",
    "has-[>[data-slot=alert-action]]:grid has-[>[data-slot=alert-action]]:grid-cols-[minmax(0,1fr)_auto] has-[>[data-slot=alert-action]]:gap-x-4",
    "text-foreground [&>[data-slot=alert-description]]:text-muted-foreground-1 [&>svg]:text-[var(--intent-text,var(--muted-foreground-1))]",
  ],
  {
    variants: { color: alertColors },
    defaultVariants: { color: "neutral" },
  },
);

export type AlertProps = Omit<ComponentProps<"div">, "color"> &
  VariantProps<typeof alertVariants>;

export function Alert({ className, color, ...props }: AlertProps) {
  return (
    <div
      role="alert"
      data-slot="alert"
      className={alertVariants({ color, className })}
      {...props}
    />
  );
}

export type AlertTitleProps = ComponentProps<"h5">;

export function AlertTitle({ className, ...props }: AlertTitleProps) {
  return (
    <h5
      data-slot="alert-title"
      className={cx(
        "text-sm font-medium leading-4 break-words [&:has(~[data-slot=alert-description])]:mb-1",
        className,
      )}
      {...props}
    />
  );
}

export type AlertDescriptionProps = ComponentProps<"div">;

export function AlertDescription({
  className,
  ...props
}: AlertDescriptionProps) {
  return (
    <div
      data-slot="alert-description"
      className={cx("text-sm font-normal break-words", className)}
      {...props}
    />
  );
}

export type AlertActionProps = ComponentProps<"div">;

export function AlertAction({ className, ...props }: AlertActionProps) {
  return (
    <div
      data-slot="alert-action"
      className={cx(
        "col-start-2 row-span-2 row-start-1 flex items-center gap-2 self-center",
        className,
      )}
      {...props}
    />
  );
}
