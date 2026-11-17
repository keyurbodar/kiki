import { Checkbox as BaseCheckbox } from "@base-ui/react/checkbox";
import { cx } from "class-variance-authority";
import type { ComponentProps } from "react";
import { motion } from "@/lib/motion";
import { Icon } from "@/primitives/icon";

const boxClassName =
  "relative flex size-4 shrink-0 items-center justify-center rounded-(--radius-sm) border-hairline border-border-3 bg-input text-primary-foreground transition-colors duration-100 data-[checked]:border-transparent data-[checked]:bg-primary data-[checked]:[--focus-ring:var(--primary-text)] data-[indeterminate]:border-transparent data-[indeterminate]:bg-primary data-[indeterminate]:[--focus-ring:var(--primary-text)]";

export type CheckboxProps = ComponentProps<typeof BaseCheckbox.Root>;

export function Checkbox({ className, ...props }: CheckboxProps) {
  return (
    <BaseCheckbox.Root
      data-slot="checkbox"
      className={(state) =>
        cx(
          boxClassName,
          "cursor-pointer",
          motion.focusRing,
          motion.touchTarget,
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
              className="size-3"
            />
          </span>
        )}
      />
    </BaseCheckbox.Root>
  );
}
