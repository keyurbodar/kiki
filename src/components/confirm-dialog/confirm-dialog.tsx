import type { ComponentProps } from "react";

export type ConfirmDialogProps = ComponentProps<"div">;

export function ConfirmDialog(props: ConfirmDialogProps) {
  return <div {...props} />;
}
