import { Checkbox as BaseCheckbox } from "@base-ui/react/checkbox";
import type { ComponentProps } from "react";

export type CheckboxProps = ComponentProps<typeof BaseCheckbox.Root>;

export function Checkbox(props: CheckboxProps) {
  return (
    <BaseCheckbox.Root data-slot="checkbox" {...props}>
      <BaseCheckbox.Indicator data-slot="checkbox-indicator" />
    </BaseCheckbox.Root>
  );
}
