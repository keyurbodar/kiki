import { Input as BaseInput } from "@base-ui/react/input";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

export const inputVariants = cva("", {
  variants: {
    variant: { default: "", blank: "", ghost: "" },
    size: { xs: "", sm: "", base: "" },
    font: { sans: "", mono: "", numeric: "" },
  },
  defaultVariants: { variant: "default", size: "base", font: "sans" },
});

export type InputVariants = VariantProps<typeof inputVariants>;

export type InputProps = Omit<
  ComponentProps<typeof BaseInput>,
  "className" | "size"
> &
  InputVariants & { className?: string };

export function Input({
  className,
  variant,
  size,
  font,
  ...props
}: InputProps) {
  return (
    <BaseInput
      data-slot="input"
      className={inputVariants({ variant, size, font, className })}
      {...props}
    />
  );
}

export type InputGroupProps = ComponentProps<"div">;

export function InputGroup(props: InputGroupProps) {
  return <div data-slot="input-group" {...props} />;
}
