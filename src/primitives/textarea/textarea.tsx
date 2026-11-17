import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

export const textareaVariants = cva("", {
  variants: {
    variant: { default: "", blank: "", editor: "" },
    font: { sans: "", mono: "" },
    size: { auto: "", base: "" },
  },
  defaultVariants: { variant: "default", font: "sans", size: "auto" },
});

export type TextareaProps = ComponentProps<"textarea"> &
  VariantProps<typeof textareaVariants>;

export function Textarea({
  className,
  variant,
  font,
  size,
  ...props
}: TextareaProps) {
  return (
    <textarea
      data-slot="textarea"
      className={textareaVariants({ variant, font, size, className })}
      {...props}
    />
  );
}
