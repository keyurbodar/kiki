import type { ComponentProps } from "react";

export type CostBadgeProps = ComponentProps<"div">;

export function CostBadge(props: CostBadgeProps) {
  return <div {...props} />;
}
