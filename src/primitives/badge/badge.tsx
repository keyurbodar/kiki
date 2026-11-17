import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { intentVariants } from "@/primitives/intent";

export const badgeVariants = cva("", {
  variants: {
    variant: { default: "", ghost: "", filled: "" },
    color: intentVariants,
    size: { base: "", sm: "", xs: "", count: "", auto: "" },
    interactive: { true: "", false: "" },
  },
  defaultVariants: {
    variant: "default",
    color: "neutral",
    size: "base",
    interactive: false,
  },
});

export type BadgeProps = Omit<ComponentProps<"span">, "color"> &
  VariantProps<typeof badgeVariants>;

export function Badge({
  className,
  variant,
  color,
  size,
  interactive,
  ...props
}: BadgeProps) {
  return (
    <span
      data-slot="badge"
      className={badgeVariants({
        variant,
        color,
        size,
        interactive,
        className,
      })}
      {...props}
    />
  );
}
