import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { intentVariants } from "@/primitives/intent";

export const alertVariants = cva("", {
  variants: { color: intentVariants },
  defaultVariants: { color: "neutral" },
});

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

export type AlertTitleProps = ComponentProps<"div">;

export function AlertTitle(props: AlertTitleProps) {
  return <div data-slot="alert-title" {...props} />;
}

export type AlertDescriptionProps = ComponentProps<"div">;

export function AlertDescription(props: AlertDescriptionProps) {
  return <div data-slot="alert-description" {...props} />;
}

export type AlertActionProps = ComponentProps<"div">;

export function AlertAction(props: AlertActionProps) {
  return <div data-slot="alert-action" {...props} />;
}
