import { Switch as BaseSwitch } from "@base-ui/react/switch";
import { cx } from "class-variance-authority";
import type { ComponentProps } from "react";

export type SwitchProps = ComponentProps<typeof BaseSwitch.Root>;

export function Switch({ className, ...props }: SwitchProps) {
  return (
    <BaseSwitch.Root
      data-slot="switch"
      className={(state) =>
        cx(
          "relative inline-flex h-4 w-7 shrink-0 cursor-pointer items-center rounded-full border-hairline border-border-2 bg-muted p-switch-inset",
          "transition-colors duration-fast outline-none",
          "focus-visible:outline-ring-inset",
          "pointer-coarse:after:absolute pointer-coarse:after:top-1/2 pointer-coarse:after:left-1/2 pointer-coarse:after:size-full pointer-coarse:after:min-h-11 pointer-coarse:after:min-w-11 pointer-coarse:after:-translate-x-1/2 pointer-coarse:after:-translate-y-1/2",
          "data-[checked]:border-transparent data-[checked]:bg-primary data-[checked]:[--focus-ring:var(--primary-text)]",
          "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-55",
          typeof className === "function" ? className(state) : className,
        )
      }
      {...props}
    >
      <BaseSwitch.Thumb
        data-slot="switch-thumb"
        className="size-3 rounded-full bg-primary-foreground shadow-plate transition-transform duration-fast ease-out-quint data-[checked]:translate-x-3 motion-reduce:transition-none"
      />
    </BaseSwitch.Root>
  );
}
