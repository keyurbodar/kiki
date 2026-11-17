import type { ComponentProps } from "react";

export type ReplyQuoteProps = ComponentProps<"div">;

export function ReplyQuote(props: ReplyQuoteProps) {
  return <div data-slot="reply-quote" {...props} />;
}
