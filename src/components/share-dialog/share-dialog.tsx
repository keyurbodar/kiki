import type { ComponentProps } from "react";

export type ShareDialogProps = ComponentProps<"div">;

export function ShareDialog(props: ShareDialogProps) {
  return <div {...props} />;
}
