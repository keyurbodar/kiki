import { Checkbox as BaseCheckbox } from "@base-ui/react/checkbox";
import { cx } from "class-variance-authority";
import type { ComponentProps } from "react";
import { Icon } from "@/primitives/icon";

const checkboxBoxClassName =
  "relative flex size-4 shrink-0 items-center justify-center rounded-(--radius-sm) border-hairline border-border-3 bg-input text-primary-foreground transition-colors duration-100 data-[checked]:border-transparent data-[checked]:bg-primary data-[checked]:[--focus-ring:var(--primary-text)] data-[indeterminate]:border-transparent data-[indeterminate]:bg-primary data-[indeterminate]:[--focus-ring:var(--primary-text)]";

export type CheckboxProps = ComponentProps<typeof BaseCheckbox.Root>;

export function Checkbox({ className, ...props }: CheckboxProps) {
  return (
    <BaseCheckbox.Root
      data-slot="checkbox"
      className={(state) =>
        cx(
          checkboxBoxClassName,
          "cursor-pointer outline-none",
          "focus-visible:outline-ring-inset",
          "pointer-coarse:after:absolute pointer-coarse:after:top-1/2 pointer-coarse:after:left-1/2 pointer-coarse:after:size-full pointer-coarse:after:min-h-11 pointer-coarse:after:min-w-11 pointer-coarse:after:-translate-x-1/2 pointer-coarse:after:-translate-y-1/2",
          "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-55",
          typeof className === "function" ? className(state) : className,
        )
      }
      {...props}
    >
      <BaseCheckbox.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center"
        render={(indicatorProps, state) => (
          <span {...indicatorProps}>
            <Icon
              name={state.indeterminate ? "minus-medium" : "checkmark-1"}
              size={null}
              className="size-3"
            />
          </span>
        )}
      />
    </BaseCheckbox.Root>
  );
}
