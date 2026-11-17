import type { ComponentProps } from "react";

export type FeedbackDialogProps = ComponentProps<"div">;

export function FeedbackDialog(props: FeedbackDialogProps) {
  return <div {...props} />;
}
