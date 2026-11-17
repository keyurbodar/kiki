import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

export const textareaVariants = cva(
  [
    "w-full min-w-0 resize-none text-foreground outline-none selection:bg-primary-20",
    "placeholder:text-muted-foreground-3",
    "disabled:cursor-not-allowed disabled:opacity-55 aria-invalid:border-destructive",
  ],
  {
    variants: {
      variant: {
        default:
          "rounded bg-input px-2.5 py-1.5 text-sm font-normal border-hairline border-border-2 focus-visible:outline-ring-inset",
        blank:
          "field-sizing-content border-0 bg-transparent p-0 text-sm font-normal",
        editor:
          "rounded-none border-0 bg-card px-4 py-3 font-mono text-code-block leading-[1.5] focus-visible:outline-ring-inset",
      },
      font: { sans: "", mono: "font-mono text-xs" },
      size: {
        auto: "",
        base: "field-sizing-content min-h-(--h-control-base) py-[calc((var(--h-control-base)-1lh-var(--spacing-hairline)*2)/2)]",
      },
    },
    defaultVariants: { variant: "default", font: "sans", size: "auto" },
  },
);

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
