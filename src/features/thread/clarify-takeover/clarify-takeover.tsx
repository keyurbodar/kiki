import type { ComponentProps } from "react";

export type ClarifyTakeoverProps = ComponentProps<"div">;

export function ClarifyTakeover(props: ClarifyTakeoverProps) {
  return <div data-slot="clarify-takeover" {...props} />;
}
