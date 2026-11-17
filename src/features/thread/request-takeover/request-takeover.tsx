import type { ComponentProps } from "react";

export type RequestTakeoverProps = ComponentProps<"div">;

export function RequestTakeover(props: RequestTakeoverProps) {
  return <div data-slot="request-takeover" {...props} />;
}
