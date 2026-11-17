import type { ComponentProps } from "react";

export type ColorPickerProps = ComponentProps<"div">;

export function ColorPicker(props: ColorPickerProps) {
  return <div data-slot="color-picker" {...props} />;
}
