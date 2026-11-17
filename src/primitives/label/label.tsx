import { Field } from "@base-ui/react/field";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

export const labelVariants = cva("", {
  variants: { tone: { muted: "", strong: "" } },
  defaultVariants: { tone: "muted" },
});

export type LabelProps = Omit<ComponentProps<typeof Field.Label>, "className"> &
  VariantProps<typeof labelVariants> & { className?: string };

export function Label({ className, tone, ...props }: LabelProps) {
  return (
    <Field.Label
      data-slot="label"
      className={labelVariants({ tone, className })}
      {...props}
    />
  );
}
