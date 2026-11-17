import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

export const kbdVariants = cva("", {
  variants: { variant: { default: "", chip: "", onFill: "" } },
  defaultVariants: { variant: "default" },
});

export type KbdProps = ComponentProps<"kbd"> & VariantProps<typeof kbdVariants>;

export function Kbd({ className, variant, ...props }: KbdProps) {
  return (
    <kbd
      data-slot="kbd"
      className={kbdVariants({ variant, className })}
      {...props}
    />
  );
}
