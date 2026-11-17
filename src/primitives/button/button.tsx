import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { intentVariants } from "@/primitives/intent";

export const buttonVariants = cva("", {
  variants: {
    variant: {
      solid: "",
      soft: "",
      ghost: "",
      outline: "",
      link: "",
      bare: "",
      inverse: "",
      segmented: "",
    },
    intent: intentVariants,
    size: {
      auto: "",
      "auto-sm": "",
      "auto-xs": "",
      xs: "",
      sm: "",
      base: "",
      lg: "",
      "icon-xs": "",
      "icon-sm": "",
      "icon-sm-narrow": "",
      "icon-base": "",
      "icon-shrink": "",
    },
    shape: { default: "", "segment-start": "", "segment-end": "" },
  },
  defaultVariants: {
    variant: "solid",
    intent: "neutral",
    size: "sm",
    shape: "default",
  },
});

export type ButtonVariants = VariantProps<typeof buttonVariants>;

export type ButtonProps = useRender.ComponentProps<"button"> & ButtonVariants;

export function Button({
  render,
  className,
  variant,
  intent,
  size,
  shape,
  ...props
}: ButtonProps) {
  return useRender({
    defaultTagName: "button",
    render,
    props: mergeProps<"button">(
      {
        "data-slot": "button",
        className: buttonVariants({ variant, intent, size, shape, className }),
      } as ComponentProps<"button">,
      props,
    ),
  });
}

export type ButtonIconProps = ComponentProps<"span">;

export function ButtonIcon(props: ButtonIconProps) {
  return <span data-slot="button-icon" {...props} />;
}
