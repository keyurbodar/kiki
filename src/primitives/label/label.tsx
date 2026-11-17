import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

export const labelVariants = cva(
  "flex w-fit select-none items-center gap-1.5 text-sm font-medium text-foreground",
  {
    variants: { tone: { muted: "", strong: "" } },
    defaultVariants: { tone: "muted" },
  },
);

export type LabelProps = Omit<ComponentProps<"label">, "className"> &
  VariantProps<typeof labelVariants> & { className?: string };

export function Label({ className, tone, ...props }: LabelProps) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: the caller names the control with htmlFor, or renders it inside the label
    <label
      data-slot="label"
      className={labelVariants({ tone, className })}
      {...props}
    />
  );
}
