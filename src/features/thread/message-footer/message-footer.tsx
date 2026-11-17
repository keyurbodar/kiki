import type { ComponentProps } from "react";

export type MessageFooterProps = ComponentProps<"div">;

export function MessageFooter(props: MessageFooterProps) {
  return <div data-slot="message-footer" {...props} />;
}
