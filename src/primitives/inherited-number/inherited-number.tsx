import { NumberField as BaseNumberField } from "@base-ui/react/number-field";
import type { ComponentProps } from "react";

export const InheritedNumber = BaseNumberField.Root;

export type InheritedNumberProps = ComponentProps<typeof BaseNumberField.Root>;

export type InheritedNumberInputProps = ComponentProps<
  typeof BaseNumberField.Input
>;

export function InheritedNumberInput(props: InheritedNumberInputProps) {
  return <BaseNumberField.Input data-slot="input" {...props} />;
}
