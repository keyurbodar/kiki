import type { ComponentProps } from "react";

export type ContextMeterProps = ComponentProps<"div">;

export function ContextMeter(props: ContextMeterProps) {
  return <div {...props} />;
}
