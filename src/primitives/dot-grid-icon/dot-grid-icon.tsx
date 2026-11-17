import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

export const dotGridIconVariants = cva("", {
  variants: { size: { xs: "", sm: "", base: "", inherit: "" } },
  defaultVariants: { size: "base" },
});

export type DotGridIconProps = ComponentProps<"span"> &
  VariantProps<typeof dotGridIconVariants>;

export function DotGridIcon({ className, size, ...props }: DotGridIconProps) {
  return (
    <span
      aria-hidden
      data-slot="dot-grid-icon"
      className={dotGridIconVariants({ size, className })}
      {...props}
    />
  );
}
