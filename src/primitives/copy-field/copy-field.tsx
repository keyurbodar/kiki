import type { ComponentProps } from "react";

export type CopyFieldProps = ComponentProps<"div">;

export function CopyField(props: CopyFieldProps) {
  return <div data-slot="copy-field" {...props} />;
}
