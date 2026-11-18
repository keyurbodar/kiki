import { Input as BaseInput } from "@base-ui/react/input";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps, ReactNode } from "react";

export const inputVariants = cva(
  [
    "min-w-0 rounded text-sm font-normal text-foreground",
    "placeholder:text-muted-foreground-3 selection:bg-primary-20",
    "outline-none",
    "disabled:cursor-not-allowed disabled:opacity-55",
    "aria-invalid:border-destructive",
  ],
  {
    variants: {
      variant: {
        default:
          "bg-input border-hairline border-border-2 focus-visible:outline-ring-inset",
        blank: "bg-transparent border-0",
        ghost:
          "field-sizing-content text-ellipsis bg-transparent border-hairline border-transparent font-medium placeholder:text-foreground transition-[border-color,background-color] duration-fast hover:border-border-2 hover:bg-input focus-visible:border-border-2 focus-visible:bg-input focus-visible:outline-ring-inset",
      },
      size: {
        xs: "h-(--h-control-xs) px-1.5 text-xs",
        sm: "h-(--h-control-sm) px-2",
        base: "h-(--h-control-base) px-2.5",
      },
      font: { sans: "", mono: "font-mono text-xs", numeric: "tabular-nums" },
    },
    defaultVariants: { variant: "default", size: "base", font: "sans" },
  },
);

export type InputVariants = VariantProps<typeof inputVariants>;

export type InputProps = Omit<
  ComponentProps<typeof BaseInput>,
  "className" | "size"
> &
  InputVariants & {
    className?: string;
    icon?: ReactNode;
    wrapperClassName?: string;
  };

export function Input({
  className,
  variant,
  size,
  font,
  icon,
  wrapperClassName,
  ...props
}: InputProps) {
  const input = (
    <BaseInput
      data-slot="input"
      className={inputVariants({
        variant,
        size,
        font,
        className: icon
          ? [size === "sm" ? "pl-7" : "pl-8", className]
          : className,
      })}
      {...props}
    />
  );
  if (!icon) return input;
  return (
    <InputGroup
      className={["w-full", wrapperClassName].filter(Boolean).join(" ")}
    >
      <span
        aria-hidden
        className={[
          "pointer-events-none absolute top-1/2 -translate-y-1/2 text-icon-muted [&_svg]:size-(--icon-sm)",
          size === "sm" ? "left-2" : "left-2.5",
        ].join(" ")}
      >
        {icon}
      </span>
      {input}
    </InputGroup>
  );
}

export type InputGroupProps = ComponentProps<"div">;

export function InputGroup({ className, ...props }: InputGroupProps) {
  return (
    <div
      data-slot="input-group"
      className={[
        "relative inline-flex [&>[data-slot=input]]:w-full",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}
